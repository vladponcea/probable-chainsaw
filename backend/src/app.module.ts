import { Module } from '@nestjs/common';
import { ClientsModule } from './modules/clients/clients.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SyncModule } from './modules/sync/sync.module';
import { MockDataModule } from './modules/mock-data/mock-data.module';
import { StatusMappingModule } from './modules/status-mapping/status-mapping.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    IntegrationsModule,
    DashboardModule,
    SyncModule,
    MockDataModule,
    StatusMappingModule,
  ],
})
export class AppModule {}

