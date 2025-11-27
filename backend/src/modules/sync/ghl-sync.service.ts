import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GhlSyncService {
    private readonly logger = new Logger(GhlSyncService.name);

    constructor(private prisma: PrismaService) { }

    private createGhlClient(apiKey: string): AxiosInstance {
        return axios.create({
            baseURL: 'https://services.leadconnectorhq.com',
            headers: {
                Authorization: `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28', // GHL API Version header
            },
        });
    }

    private async validateApiKey(client: AxiosInstance): Promise<void> {
        // Make a simple API call to validate the key
        // Using /contacts with limit 1 is a safe read-only check
        try {
            await client.get('/contacts/', {
                params: { limit: 1 },
            });
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                const errorMsg = error.response?.data?.message || 'Authentication failed';
                this.logger.error(`GHL API authentication failed: ${JSON.stringify(error.response?.data)}`);
                throw new Error(errorMsg);
            }
            this.logger.error(`GHL API validation error: ${error.message}`);
            throw error;
        }
    }

    async syncClientGhl(clientId: string): Promise<void> {
        try {
            // Get GHL integration
            const integration = await this.prisma.clientIntegration.findUnique({
                where: {
                    clientId_provider: {
                        clientId,
                        provider: 'ghl',
                    },
                },
            });

            if (!integration || !integration.apiKey) {
                this.logger.warn(`No GHL integration found for client ${clientId}`);
                return;
            }

            // Trim whitespace from API key
            const apiKey = integration.apiKey.trim();
            if (!apiKey) {
                throw new Error('GHL CRM API key is empty');
            }

            const client = this.createGhlClient(apiKey);

            // First, validate the API key by making a simple test call
            try {
                await this.validateApiKey(client);
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message;
                this.logger.error(`GHL API key validation failed: ${errorMsg}`);
                throw new Error(`Invalid GHL CRM API key: ${errorMsg}`);
            }

            // Fetch contacts (leads)
            await this.syncContacts(clientId, client);

            // Fetch opportunities (deals)
            await this.syncOpportunities(clientId, client);

            this.logger.log(`Synced GHL CRM data for client ${clientId}`);
        } catch (error: any) {
            this.logger.error(
                `Error syncing GHL CRM for client ${clientId}: ${error.message}`,
            );
            throw error;
        }
    }

    private async syncContacts(clientId: string, client: AxiosInstance) {
        let response;
        try {
            response = await client.get('/contacts/', {
                params: {
                    limit: 100,
                },
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            throw new Error(`Failed to fetch GHL contacts: ${errorMsg}`);
        }

        const contacts = response.data?.contacts || [];

        if (!Array.isArray(contacts)) {
            this.logger.warn(`Unexpected GHL API response format for contacts`);
            return;
        }

        for (const contact of contacts) {
            if (!contact.id) {
                continue;
            }

            const existingLead = await this.prisma.lead.findFirst({
                where: {
                    clientId,
                    externalId: contact.id,
                    source: 'ghl',
                },
            });

            if (existingLead) {
                await this.prisma.lead.update({
                    where: { id: existingLead.id },
                    data: {
                        firstName: contact.firstName || null,
                        lastName: contact.lastName || null,
                        email: contact.email || null,
                        updatedAt: new Date(),
                    },
                });
            } else {
                await this.prisma.lead.create({
                    data: {
                        clientId,
                        externalId: contact.id,
                        source: 'ghl',
                        firstName: contact.firstName || null,
                        lastName: contact.lastName || null,
                        email: contact.email || null,
                        createdAt: new Date(contact.dateAdded || Date.now()),
                    },
                });
            }
        }
    }

    private async syncOpportunities(clientId: string, client: AxiosInstance) {
        let response;
        try {
            // GHL Opportunities endpoint usually requires a pipeline ID, but let's try fetching all
            // If pipeline ID is required, we might need to fetch pipelines first.
            // For now, assuming we can fetch list or we iterate pipelines if needed.
            // Note: GHL V2 opportunities search might need specific params.
            // Let's try the search endpoint which is common.
            response = await client.get('/opportunities/search', {
                params: {
                    limit: 100,
                },
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            // If 404 or similar, it might be that we need to use a different endpoint structure
            // But /opportunities/search is standard in V2.
            throw new Error(`Failed to fetch GHL opportunities: ${errorMsg}`);
        }

        const opportunities = response.data?.opportunities || [];

        if (!Array.isArray(opportunities)) {
            this.logger.warn(`Unexpected GHL API response format for opportunities`);
            return;
        }

        for (const opp of opportunities) {
            if (!opp.id) {
                continue;
            }

            // Get stage change date
            const lastStageChangeDate = opp.dateStageChange
                ? new Date(opp.dateStageChange)
                : null;

            const existingDeal = await this.prisma.deal.findFirst({
                where: {
                    clientId,
                    externalId: opp.id,
                    source: 'ghl',
                },
            });

            // Link to lead
            let linkedLeadId: string | null = null;
            if (opp.contactId) {
                const linkedLead = await this.prisma.lead.findFirst({
                    where: {
                        clientId,
                        externalId: opp.contactId,
                        source: 'ghl',
                    },
                });
                if (linkedLead) {
                    linkedLeadId = linkedLead.id;
                }
            }

            if (existingDeal) {
                await this.prisma.deal.update({
                    where: { id: existingDeal.id },
                    data: {
                        name: opp.name || null,
                        amount: opp.monetaryValue ? Number(opp.monetaryValue) : null,
                        currency: 'USD', // GHL usually defaults to account currency, assuming USD for now
                        stage: opp.pipelineStageId || null,
                        status: opp.status || null, // open, won, lost, abandoned
                        lastStageChangeDate,
                        updatedAt: new Date(),
                    },
                });

                if (linkedLeadId) {
                    await this.prisma.lead.updateMany({
                        where: { id: linkedLeadId },
                        data: { dealId: existingDeal.id },
                    });
                }
            } else {
                const newDeal = await this.prisma.deal.create({
                    data: {
                        clientId,
                        externalId: opp.id,
                        source: 'ghl',
                        name: opp.name || null,
                        amount: opp.monetaryValue ? Number(opp.monetaryValue) : null,
                        currency: 'USD',
                        stage: opp.pipelineStageId || null,
                        status: opp.status || null,
                        createdAt: new Date(opp.createdAt || Date.now()),
                        lastStageChangeDate,
                    },
                });

                if (linkedLeadId) {
                    await this.prisma.lead.updateMany({
                        where: { id: linkedLeadId },
                        data: { dealId: newDeal.id },
                    });
                }
            }
        }
    }
}
