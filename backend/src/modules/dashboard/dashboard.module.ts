import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ClientsModule } from '../clients/clients.module';
import { MetricsModule } from '../metrics/metrics.module';
import { SyncModule } from '../sync/sync.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ClientsModule, MetricsModule, SyncModule, IntegrationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

