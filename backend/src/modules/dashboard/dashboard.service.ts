import { Injectable } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { MetricsService, TimePeriod } from '../metrics/metrics.service';
import { SyncService, SyncProgress } from '../sync/sync.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { ConnectIntegrationDto } from '../integrations/dto/connect-integration.dto';

@Injectable()
export class DashboardService {
  constructor(
    private clientsService: ClientsService,
    private metricsService: MetricsService,
    private syncService: SyncService,
    private integrationsService: IntegrationsService,
  ) {}

  async getMetrics(
    token: string,
    period: TimePeriod = 'mtd',
    startDate?: string,
    endDate?: string,
  ) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const metrics = await this.metricsService.getAllMetrics(
      clientData.clientId,
      period,
      startDate,
      endDate,
    );

    return metrics;
  }

  async triggerSync(token: string) {
    try {
      const clientData = await this.clientsService.findByOnboardingToken(token);
      // Start sync asynchronously (don't await)
      this.syncService.syncClient(clientData.clientId).catch((error) => {
        // Error is already logged in sync service
        console.error(`Sync error for client ${clientData.clientId}:`, error);
      });
      
      return { 
        success: true, 
        message: 'Sync started',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to start sync',
      };
    }
  }

  async getSyncStatus(token: string) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const status = this.syncService.getSyncStatus(clientData.clientId);
    return status;
  }

  async getSyncProgress(token: string): Promise<SyncProgress | null> {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    const progress = this.syncService.getSyncProgress(clientData.clientId);
    return progress;
  }

  async clearSyncProgress(token: string) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    this.syncService.clearSyncProgress(clientData.clientId);
    return { success: true };
  }

  async updateIntegration(
    token: string,
    provider: 'calendly' | 'close' | 'stripe',
    dto: ConnectIntegrationDto,
  ) {
    switch (provider) {
      case 'calendly':
        return this.integrationsService.connectCalendly(token, dto);
      case 'close':
        return this.integrationsService.connectClose(token, dto);
      case 'stripe':
        return this.integrationsService.connectStripe(token, dto);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

