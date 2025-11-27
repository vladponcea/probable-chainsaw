import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendlySyncService } from './calendly-sync.service';
import { CloseSyncService } from './close-sync.service';
import { GhlSyncService } from './ghl-sync.service';
import { StripeSyncService } from './stripe-sync.service';

export interface SyncProgress {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  progress: number; // 0-100
  currentStep: string;
  logs: string[];
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncStatus: Map<string, { lastSync: Date; status: string }> =
    new Map();
  private syncProgress: Map<string, SyncProgress> = new Map();

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

  private updateProgress(
    clientId: string,
    updates: Partial<SyncProgress>,
  ): void {
    const current = this.syncProgress.get(clientId) || {
      status: 'syncing' as const,
      progress: 0,
      currentStep: '',
      logs: [],
    };
    this.syncProgress.set(clientId, { ...current, ...updates });
  }

  private addLog(clientId: string, message: string): void {
    const current = this.syncProgress.get(clientId);
    if (current) {
      const timestamp = new Date().toLocaleTimeString();
      current.logs.push(`[${timestamp}] ${message}`);
      // Keep only last 50 logs
      if (current.logs.length > 50) {
        current.logs.shift();
      }
      this.syncProgress.set(clientId, current);
    }
  }

  async syncClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Initialize progress
    this.syncProgress.set(clientId, {
      status: 'syncing',
      progress: 0,
      currentStep: 'Starting sync...',
      logs: [],
      startedAt: new Date(),
    });

    this.logger.log(`Syncing client ${clientId}`);
    this.addLog(clientId, 'Starting sync process...');

    const errors: string[] = [];
    const integrations: string[] = [];

    if (client.calendlyConnected) integrations.push('Calendly');
    if (client.closeConnected) integrations.push('Close CRM');
    if (client.stripeConnected) integrations.push('Stripe');

    const totalSteps = integrations.length;
    let completedSteps = 0;

    // Sync integrations in parallel for better performance
    const syncPromises: Promise<void>[] = [];
    const completedCount = { value: 0 }; // Use object to allow mutation in closures

    const updateProgressSafely = () => {
      completedCount.value++;
      this.updateProgress(clientId, {
        progress: Math.round((completedCount.value / totalSteps) * 100),
      });
    };

    if (client.calendlyConnected) {
      syncPromises.push(
        (async () => {
          try {
            this.updateProgress(clientId, {
              currentStep: 'Syncing Calendly events...',
              progress: Math.round((completedCount.value / totalSteps) * 100),
            });
            this.addLog(clientId, 'Syncing Calendly events...');
            
            await this.calendlySync.syncClientCalendly(clientId, (message) => {
              this.addLog(clientId, message);
            });
            
            this.updateProgress(clientId, {
              currentStep: 'Calendly sync completed',
            });
            this.addLog(clientId, 'Calendly sync completed successfully');
            updateProgressSafely();
          } catch (error: any) {
            const errorMsg = `Calendly: ${error.message}`;
            errors.push(errorMsg);
            this.logger.error(`Error syncing Calendly for client ${clientId}: ${error.message}`);
            this.addLog(clientId, `Calendly sync failed: ${error.message}`);
            updateProgressSafely();
          }
        })(),
      );
    }

    if (client.closeConnected) {
      syncPromises.push(
        (async () => {
          try {
            this.updateProgress(clientId, {
              currentStep: 'Syncing Close CRM data...',
              progress: Math.round((completedCount.value / totalSteps) * 100),
            });
            this.addLog(clientId, 'Syncing Close CRM data...');
            
            await this.closeSync.syncClientClose(clientId);
            
            this.updateProgress(clientId, {
              currentStep: 'Close CRM sync completed',
            });
            this.addLog(clientId, 'Close CRM sync completed successfully');
            updateProgressSafely();
          } catch (error: any) {
            const errorMsg = `Close CRM: ${error.message}`;
            errors.push(errorMsg);
            this.logger.error(`Error syncing Close CRM for client ${clientId}: ${error.message}`);
            this.addLog(clientId, `Close CRM sync failed: ${error.message}`);
            updateProgressSafely();
          }
        })(),
      );
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
      syncPromises.push(
        (async () => {
          try {
            this.updateProgress(clientId, {
              currentStep: 'Syncing Stripe payments...',
              progress: Math.round((completedCount.value / totalSteps) * 100),
            });
            this.addLog(clientId, 'Syncing Stripe payments...');
            
            await this.stripeSync.syncClientStripe(clientId);
            
            this.updateProgress(clientId, {
              currentStep: 'Stripe sync completed',
            });
            this.addLog(clientId, 'Stripe sync completed successfully');
            updateProgressSafely();
          } catch (error: any) {
            const errorMsg = `Stripe: ${error.message}`;
            errors.push(errorMsg);
            this.logger.error(`Error syncing Stripe for client ${clientId}: ${error.message}`);
            this.addLog(clientId, `Stripe sync failed: ${error.message}`);
            updateProgressSafely();
          }
        })(),
      );
    }

    // Wait for all syncs to complete
    await Promise.all(syncPromises);

    // Update sync status
    if (errors.length > 0) {
      const statusMsg = errors.length === 1
        ? `error: ${errors[0]}`
        : `errors: ${errors.join('; ')}`;
      this.syncStatus.set(clientId, {
        lastSync: new Date(),
        status: statusMsg,
      });
      this.updateProgress(clientId, {
        status: 'error',
        currentStep: `Sync completed with ${errors.length} error(s)`,
        progress: 100,
        completedAt: new Date(),
      });
      this.addLog(clientId, `Sync completed with errors: ${statusMsg}`);
      this.logger.warn(`Partial sync for client ${clientId}: ${statusMsg}`);
    } else {
      this.syncStatus.set(clientId, {
        lastSync: new Date(),
        status: 'success',
      });
      this.updateProgress(clientId, {
        status: 'completed',
        currentStep: 'Sync completed successfully',
        progress: 100,
        completedAt: new Date(),
      });
      this.addLog(clientId, 'Sync completed successfully');
      this.logger.log(`Successfully synced client ${clientId}`);
    }
  }

  getSyncStatus(clientId: string): { lastSync: Date | null; status: string } {
    const status = this.syncStatus.get(clientId);
    return status || { lastSync: null, status: 'never_synced' };
  }

  getSyncProgress(clientId: string): SyncProgress | null {
    return this.syncProgress.get(clientId) || null;
  }

  clearSyncProgress(clientId: string): void {
    this.syncProgress.delete(clientId);
  }
}

