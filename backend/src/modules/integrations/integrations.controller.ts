import { Controller, Post, Body, Param } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';

@Controller('onboarding/:token/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) { }

  @Post('calendly')
  connectCalendly(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connectCalendly(token, dto);
  }

  @Post('close')
  connectClose(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connectClose(token, dto);
  }

  @Post('ghl')
  connectGhl(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connectGhl(token, dto);
  }

  @Post('stripe')
  connectStripe(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connectStripe(token, dto);
  }
}

