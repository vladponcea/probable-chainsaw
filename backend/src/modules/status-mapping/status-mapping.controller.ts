import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { StatusMappingService } from './status-mapping.service';
import { ClientsService } from '../clients/clients.service';

interface UpdateStatusMappingDto {
  showedUp: boolean;
}

interface BulkUpdateStatusMappingsDto {
  mappings: Array<{ statusId: string; showedUp: boolean }>;
}

@Controller('dashboard/:token/status-mappings')
export class StatusMappingController {
  constructor(
    private readonly statusMappingService: StatusMappingService,
    private readonly clientsService: ClientsService,
  ) {}

  @Get()
  async getStatusMappings(@Param('token') token: string) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    return this.statusMappingService.getStatusMappings(clientData.clientId);
  }

  @Post('sync')
  async syncStatusMappings(@Param('token') token: string) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    return this.statusMappingService.syncStatusMappings(clientData.clientId);
  }

  @Put()
  async bulkUpdateStatusMappings(
    @Param('token') token: string,
    @Body() dto: BulkUpdateStatusMappingsDto,
  ) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    return this.statusMappingService.bulkUpdateStatusMappings(
      clientData.clientId,
      dto.mappings,
    );
  }

  @Put(':statusId')
  async updateStatusMapping(
    @Param('token') token: string,
    @Param('statusId') statusId: string,
    @Body() dto: UpdateStatusMappingDto,
  ) {
    const clientData = await this.clientsService.findByOnboardingToken(token);
    return this.statusMappingService.updateStatusMapping(
      clientData.clientId,
      statusId,
      dto.showedUp,
    );
  }
}

