import { Module } from '@nestjs/common';
import { StatusMappingService } from './status-mapping.service';
import { StatusMappingController } from './status-mapping.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [PrismaModule, ClientsModule],
  controllers: [StatusMappingController],
  providers: [StatusMappingService],
  exports: [StatusMappingService],
})
export class StatusMappingModule {}

