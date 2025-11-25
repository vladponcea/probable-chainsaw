import { Module } from '@nestjs/common';
import { ClientsModule } from './modules/clients/clients.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ClientsModule, IntegrationsModule],
})
export class AppModule {}

