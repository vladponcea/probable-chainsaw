import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CalendlySyncService {
  private readonly logger = new Logger(CalendlySyncService.name);

  constructor(private prisma: PrismaService) {}

  private createCalendlyClient(apiKey: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.calendly.com',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async syncClientCalendly(
    clientId: string,
    onProgress?: (message: string) => void,
  ): Promise<void> {
    try {
      // Get Calendly integration
      const integration = await this.prisma.clientIntegration.findUnique({
        where: {
          clientId_provider: {
            clientId,
            provider: 'calendly',
          },
        },
      });

      if (!integration || !integration.apiKey) {
        this.logger.warn(`No Calendly integration found for client ${clientId}`);
        return;
      }

      const client = this.createCalendlyClient(integration.apiKey);

      // Fetch user info first to get organization URI
      let userResponse;
      try {
        userResponse = await client.get('/users/me');
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Invalid Calendly API key');
        }
        throw new Error(`Calendly API error: ${error.message}`);
      }

      const userResource = userResponse.data?.resource;
      if (!userResource) {
        throw new Error('Could not fetch Calendly user info');
      }

      // Get organization URI from the user's current organization
      // The organization URI is typically in the user's current_organization field
      const organizationUri = userResource.current_organization || userResource.organization;

      // Fetch all scheduled events with pagination - prefer organization level, fallback to user level
      const allEvents: any[] = [];
      let pageToken: string | null = null;
      const baseParams: any = {
        count: 100, // Maximum per page
      };

      if (organizationUri) {
        baseParams.organization = organizationUri;
      } else {
        // Fallback to user URI if organization is not available
        const userUri = userResource.uri;
        if (!userUri) {
          throw new Error('Could not fetch Calendly user or organization URI');
        }
        this.logger.warn(`No organization found for client ${clientId}, falling back to user-level events`);
        baseParams.user = userUri;
      }

      // Fetch all pages of events
      do {
        try {
          const params = { ...baseParams };
          if (pageToken) {
            params.page_token = pageToken;
          }

          const response = await client.get('/scheduled_events', { params });
          const events = response.data?.collection || [];
          
          if (Array.isArray(events)) {
            allEvents.push(...events);
          }

          // Get next page token from pagination object
          pageToken = response.data?.pagination?.next_page_token || null;
          
          const logMsg = `Fetched ${events.length} events (total so far: ${allEvents.length})`;
          this.logger.log(`${logMsg} for client ${clientId}`);
          if (onProgress) {
            onProgress(logMsg);
          }
        } catch (error: any) {
          throw new Error(`Failed to fetch Calendly events: ${error.message}`);
        }
      } while (pageToken);

      if (onProgress) {
        onProgress(`Processing ${allEvents.length} total events...`);
      }

      const events = allEvents;

      if (!Array.isArray(events)) {
        this.logger.warn(`Unexpected Calendly API response format for client ${clientId}`);
        return;
      }

      // Get all existing calls in one query for better performance
      const existingCalls = await this.prisma.bookedCall.findMany({
        where: {
          clientId,
          source: 'calendly',
        },
        select: {
          id: true,
          externalId: true,
        },
      });

      const existingCallsMap = new Map(
        existingCalls.map((call) => [call.externalId, call.id]),
      );

      // Process events in batches for better performance
      const batchSize = 500; // Increased batch size for better performance
      let processedCount = 0;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const updates: any[] = [];
        const creates: any[] = [];

        for (const event of batch) {
          if (!event.uri || !event.start_time) {
            this.logger.warn(`Skipping invalid Calendly event: ${JSON.stringify(event)}`);
            continue;
          }

          const scheduledAt = new Date(event.start_time);
          if (isNaN(scheduledAt.getTime())) {
            this.logger.warn(`Invalid date for Calendly event ${event.uri}`);
            continue;
          }

          const status = this.mapCalendlyStatus(event.status || 'active');
          const existingCallId = existingCallsMap.get(event.uri);

          if (existingCallId) {
            updates.push({
              where: { id: existingCallId },
              data: {
                scheduledAt,
                status,
                updatedAt: new Date(),
              },
            });
          } else {
            creates.push({
              clientId,
              externalId: event.uri,
              source: 'calendly',
              scheduledAt,
              status,
            });
          }
        }

        // Use transaction with optimized batch operations
        await this.prisma.$transaction(async (tx) => {
          // Batch create new calls first (faster)
          if (creates.length > 0) {
            await tx.bookedCall.createMany({
              data: creates,
              skipDuplicates: true,
            });
          }

          // Batch update existing calls using Promise.all for parallel execution
          // Process updates in parallel batches of 50
          const updateBatchSize = 50;
          for (let j = 0; j < updates.length; j += updateBatchSize) {
            const updateBatch = updates.slice(j, j + updateBatchSize);
            await Promise.all(
              updateBatch.map((update) =>
                tx.bookedCall.update({
                  where: { id: update.where.id },
                  data: {
                    scheduledAt: update.data.scheduledAt,
                    status: update.data.status,
                    updatedAt: new Date(),
                  },
                }),
              ),
            );
          }
        }, {
          timeout: 60000, // 60 second timeout for large transactions
        });

        processedCount += batch.length;
        // Update progress less frequently to reduce overhead
        if (onProgress && processedCount % 1000 === 0) {
          onProgress(`Processed ${processedCount} of ${events.length} events...`);
        }
      }

      const logMsg = `Synced ${events.length} Calendly events`;
      this.logger.log(`${logMsg} for client ${clientId}`);
      if (onProgress) {
        onProgress(logMsg);
      }
    } catch (error: any) {
      this.logger.error(
        `Error syncing Calendly for client ${clientId}: ${error.message}`,
      );
      throw error;
    }
  }

  private mapCalendlyStatus(status: string): string {
    // Map Calendly status to our status
    const statusMap: Record<string, string> = {
      active: 'scheduled',
      canceled: 'cancelled',
      completed: 'completed',
    };
    return statusMap[status] || 'scheduled';
  }
}

