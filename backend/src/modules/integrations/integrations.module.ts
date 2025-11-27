import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ClientsModule } from '../clients/clients.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [ClientsModule, SyncModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

