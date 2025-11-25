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

  async syncClientCalendly(clientId: string): Promise<void> {
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

      // Fetch user info first to get user_uri
      let userResponse;
      try {
        userResponse = await client.get('/users/me');
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Invalid Calendly API key');
        }
        throw new Error(`Calendly API error: ${error.message}`);
      }

      const userUri = userResponse.data?.resource?.uri;

      if (!userUri) {
        throw new Error('Could not fetch Calendly user URI');
      }

      // Fetch scheduled events for the user
      let response;
      try {
        response = await client.get('/scheduled_events', {
          params: {
            user: userUri,
            count: 100,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to fetch Calendly events: ${error.message}`);
      }

      const events = response.data?.collection || [];

      if (!Array.isArray(events)) {
        this.logger.warn(`Unexpected Calendly API response format for client ${clientId}`);
        return;
      }

      // Process and store events
      for (const event of events) {
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

        const existingCall = await this.prisma.bookedCall.findFirst({
          where: {
            clientId,
            externalId: event.uri,
            source: 'calendly',
          },
        });

        if (existingCall) {
          await this.prisma.bookedCall.update({
            where: { id: existingCall.id },
            data: {
              scheduledAt,
              status,
              updatedAt: new Date(),
            },
          });
        } else {
          await this.prisma.bookedCall.create({
            data: {
              clientId,
              externalId: event.uri,
              source: 'calendly',
              scheduledAt,
              status,
            },
          });
        }
      }

      this.logger.log(`Synced ${events.length} Calendly events for client ${clientId}`);
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

