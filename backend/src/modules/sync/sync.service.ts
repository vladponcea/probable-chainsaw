import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendlySyncService } from './calendly-sync.service';
import { CloseSyncService } from './close-sync.service';
import { GhlSyncService } from './ghl-sync.service';
import { StripeSyncService } from './stripe-sync.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncStatus: Map<string, { lastSync: Date; status: string }> =
    new Map();

  constructor(
    private prisma: PrismaService,
    private calendlySync: CalendlySyncService,
    private closeSync: CloseSyncService,
    private ghlSync: GhlSyncService,
    private stripeSync: StripeSyncService,
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async syncAllClients() {
    this.logger.log('Starting scheduled sync for all clients');

    const clients = await this.prisma.client.findMany({
      where: {
        OR: [
          { calendlyConnected: true },
          { closeConnected: true },
          { ghlConnected: true },
          { stripeConnected: true },
        ],
      },
    });

    for (const client of clients) {
      try {
        await this.syncClient(client.id);
      } catch (error: any) {
        this.logger.error(
          `Error syncing client ${client.id}: ${error.message}`,
        );
        // Continue with other clients even if one fails
      }
    }

    this.logger.log(`Completed scheduled sync for ${clients.length} clients`);
  }

  async syncClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    this.logger.log(`Syncing client ${clientId}`);

    const errors: string[] = [];

    // Sync each connected integration independently
    if (client.calendlyConnected) {
      try {
        await this.calendlySync.syncClientCalendly(clientId);
      } catch (error: any) {
        const errorMsg = `Calendly: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(`Error syncing Calendly for client ${clientId}: ${error.message}`);
      }
    }

    if (client.closeConnected) {
      try {
        await this.closeSync.syncClientClose(clientId);
      } catch (error: any) {
        const errorMsg = `Close CRM: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(`Error syncing Close CRM for client ${clientId}: ${error.message}`);
      }
    }

    if (client.ghlConnected) {
      try {
        await this.ghlSync.syncClientGhl(clientId);
      } catch (error: any) {
        const errorMsg = `GHL CRM: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(`Error syncing GHL CRM for client ${clientId}: ${error.message}`);
      }
    }

    if (client.stripeConnected) {
      try {
        await this.stripeSync.syncClientStripe(clientId);
      } catch (error: any) {
        const errorMsg = `Stripe: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(`Error syncing Stripe for client ${clientId}: ${error.message}`);
      }
    }

    // Update sync status
    if (errors.length > 0) {
      const statusMsg = errors.length === 1
        ? `error: ${errors[0]}`
        : `errors: ${errors.join('; ')}`;
      this.syncStatus.set(clientId, {
        lastSync: new Date(),
        status: statusMsg,
      });
      // Don't throw - allow partial success
      this.logger.warn(`Partial sync for client ${clientId}: ${statusMsg}`);
    } else {
      this.syncStatus.set(clientId, {
        lastSync: new Date(),
        status: 'success',
      });
      this.logger.log(`Successfully synced client ${clientId}`);
    }
  }

  getSyncStatus(clientId: string): { lastSync: Date | null; status: string } {
    const status = this.syncStatus.get(clientId);
    return status || { lastSync: null, status: 'never_synced' };
  }
}

