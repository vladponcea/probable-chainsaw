import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get('onboarding/:token')
  findByOnboardingToken(@Param('token') token: string) {
    return this.clientsService.findByOnboardingToken(token);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}

