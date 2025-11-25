import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CloseSyncService {
  private readonly logger = new Logger(CloseSyncService.name);

  constructor(private prisma: PrismaService) {}

  private createCloseClient(apiKey: string): AxiosInstance {
    // Close CRM uses HTTP Basic auth: base64(apikey:)
    const authString = Buffer.from(`${apiKey.trim()}:`).toString('base64');
    return axios.create({
      baseURL: 'https://api.close.com/api/v1',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private async validateApiKey(client: AxiosInstance): Promise<void> {
    // Make a simple API call to validate the key
    // Using /me endpoint which is lightweight
    try {
      await client.get('/me');
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.response?.data?.error ||
                        'Authentication failed';
        this.logger.error(`Close API authentication failed: ${JSON.stringify(error.response?.data)}`);
        throw new Error(errorMsg);
      }
      this.logger.error(`Close API validation error: ${error.message}`);
      throw error;
    }
  }

  async syncClientClose(clientId: string): Promise<void> {
    try {
      // Get Close integration
      const integration = await this.prisma.clientIntegration.findUnique({
        where: {
          clientId_provider: {
            clientId,
            provider: 'close',
          },
        },
      });

      if (!integration || !integration.apiKey) {
        this.logger.warn(`No Close integration found for client ${clientId}`);
        return;
      }

      // Trim whitespace from API key
      const apiKey = integration.apiKey.trim();
      if (!apiKey) {
        throw new Error('Close CRM API key is empty');
      }

      const client = this.createCloseClient(apiKey);

      // First, validate the API key by making a simple test call
      try {
        await this.validateApiKey(client);
      } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        this.logger.error(`Close API key validation failed: ${errorMsg}`);
        throw new Error(`Invalid Close CRM API key: ${errorMsg}`);
      }

      // Fetch leads
      await this.syncLeads(clientId, client);

      // Fetch opportunities (deals)
      await this.syncDeals(clientId, client);

      // Fetch activities to determine first contact dates
      await this.syncActivities(clientId, client);

      this.logger.log(`Synced Close CRM data for client ${clientId}`);
    } catch (error: any) {
      this.logger.error(
        `Error syncing Close CRM for client ${clientId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async syncLeads(clientId: string, client: AxiosInstance) {
    let response;
    try {
      response = await client.get('/lead', {
        params: {
          _limit: 100,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        'Invalid Close CRM API key';
        throw new Error(errorMsg);
      }
      const errorMsg = error.response?.data?.error?.message || 
                      error.response?.data?.message || 
                      error.message;
      throw new Error(`Failed to fetch Close leads: ${errorMsg}`);
    }

    const leads = response.data?.data || [];

    if (!Array.isArray(leads)) {
      this.logger.warn(`Unexpected Close API response format for leads`);
      return;
    }

    for (const lead of leads) {
      if (!lead.id) {
        this.logger.warn(`Skipping lead without ID: ${JSON.stringify(lead)}`);
        continue;
      }
      // Note: Prisma doesn't support composite unique on 3 fields directly in upsert
      // We'll use findFirst + create/update pattern
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          clientId,
          externalId: lead.id,
          source: 'close',
        },
      });

      if (existingLead) {
        await this.prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            firstName: lead.first_name || null,
            lastName: lead.last_name || null,
            email: lead.emails?.[0]?.email || null,
            status: lead.status_id || null,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.lead.create({
          data: {
            clientId,
            externalId: lead.id,
            source: 'close',
            firstName: lead.first_name || null,
            lastName: lead.last_name || null,
            email: lead.emails?.[0]?.email || null,
            status: lead.status_id || null,
            createdAt: new Date(lead.date_created || Date.now()),
          },
        });
      }
    }
  }

  private async syncDeals(clientId: string, client: AxiosInstance) {
    let response;
    try {
      response = await client.get('/opportunity', {
        params: {
          _limit: 100,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        'Invalid Close CRM API key';
        throw new Error(errorMsg);
      }
      const errorMsg = error.response?.data?.error?.message || 
                      error.response?.data?.message || 
                      error.message;
      throw new Error(`Failed to fetch Close deals: ${errorMsg}`);
    }

    const deals = response.data?.data || [];

    if (!Array.isArray(deals)) {
      this.logger.warn(`Unexpected Close API response format for deals`);
      return;
    }

    for (const deal of deals) {
      if (!deal.id) {
        this.logger.warn(`Skipping deal without ID: ${JSON.stringify(deal)}`);
        continue;
      }
      // Get stage change date from note or activity
      const lastStageChangeDate = deal.date_updated
        ? new Date(deal.date_updated)
        : null;

      const existingDeal = await this.prisma.deal.findFirst({
        where: {
          clientId,
          externalId: deal.id,
          source: 'close',
        },
      });

      // Link the deal to its lead (opportunities in Close have a lead_id)
      let linkedLeadId: string | null = null;
      if (deal.lead_id) {
        const linkedLead = await this.prisma.lead.findFirst({
          where: {
            clientId,
            externalId: deal.lead_id,
            source: 'close',
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
            name: deal.lead_name || null,
            amount: deal.value ? deal.value / 100 : null,
            currency: deal.value_currency || 'USD',
            stage: deal.status_id || null,
            status: deal.status_type || null,
            lastStageChangeDate,
            updatedAt: new Date(),
          },
        });

        // Update the lead to link it to this deal
        if (linkedLeadId) {
          await this.prisma.lead.updateMany({
            where: {
              id: linkedLeadId,
            },
            data: {
              dealId: existingDeal.id,
            },
          });
        }
      } else {
        const newDeal = await this.prisma.deal.create({
          data: {
            clientId,
            externalId: deal.id,
            source: 'close',
            name: deal.lead_name || null,
            amount: deal.value ? deal.value / 100 : null,
            currency: deal.value_currency || 'USD',
            stage: deal.status_id || null,
            status: deal.status_type || null,
            createdAt: new Date(deal.date_created || Date.now()),
            lastStageChangeDate,
          },
        });

        // Link the lead to this deal
        if (linkedLeadId) {
          await this.prisma.lead.updateMany({
            where: {
              id: linkedLeadId,
            },
            data: {
              dealId: newDeal.id,
            },
          });
        }
      }
    }
  }

  private async syncActivities(clientId: string, client: AxiosInstance) {
    // Fetch activities (calls, SMS, emails) to determine first contact
    let response;
    try {
      // Try fetching activities without _fields first to see what we get
      response = await client.get('/activity', {
        params: {
          _limit: 200,
        },
      });
    } catch (error: any) {
      // Don't fail the whole sync if activities fail - just log and continue
      this.logger.warn(`Failed to fetch Close activities: ${error.message}`);
      if (error.response?.data) {
        this.logger.warn(`Activity API error details: ${JSON.stringify(error.response.data)}`);
      }
      return;
    }

    const activities = response.data?.data || [];
    this.logger.log(`Fetched ${activities.length} activities for client ${clientId}`);

    if (activities.length === 0) {
      this.logger.warn(`No activities found for client ${clientId}`);
      return;
    }

    // Group activities by lead_id and find earliest contact
    const leadFirstContact: Record<string, Date> = {};

    for (const activity of activities) {
      // Check for lead_id in different possible fields
      const leadId = activity.lead_id || activity.lead?.id || activity.lead;
      
      if (!leadId) {
        continue;
      }

      // Check activity type - Close uses different type names
      const activityType = activity.type || activity._type || '';
      const validTypes = ['call', 'sms', 'email', 'note', 'meeting'];
      if (!validTypes.some(type => activityType.toLowerCase().includes(type))) {
        continue;
      }

      // Get activity date - try different field names
      const activityDateStr = activity.date || activity.date_created || activity.created || activity._date;
      if (!activityDateStr) {
        continue;
      }

      const activityDate = new Date(activityDateStr);
      if (isNaN(activityDate.getTime())) {
        this.logger.warn(`Invalid date for activity ${activity.id}: ${activityDateStr}`);
        continue;
      }

      // Track earliest contact for each lead
      if (
        !leadFirstContact[leadId] ||
        activityDate < leadFirstContact[leadId]
      ) {
        leadFirstContact[leadId] = activityDate;
      }
    }

    this.logger.log(`Found first contact dates for ${Object.keys(leadFirstContact).length} leads`);

    // Update leads with first contact dates
    let updatedCount = 0;
    for (const [leadExternalId, firstContactDate] of Object.entries(
      leadFirstContact,
    )) {
      const result = await this.prisma.lead.updateMany({
        where: {
          clientId,
          externalId: leadExternalId,
          source: 'close',
        },
        data: {
          firstContactDate,
        },
      });
      if (result.count > 0) {
        updatedCount++;
      }
    }

    this.logger.log(`Updated firstContactDate for ${updatedCount} leads`);
  }
}

