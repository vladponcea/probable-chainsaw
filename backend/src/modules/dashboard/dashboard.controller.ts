import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TimePeriod } from '../metrics/metrics.service';
import { ConnectIntegrationDto } from '../integrations/dto/connect-integration.dto';

@Controller('dashboard/:token')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(
    @Param('token') token: string,
    @Query('period') period?: string,
  ) {
    const timePeriod: TimePeriod =
      period === '30d' ? '30d' : 'all';
    return this.dashboardService.getMetrics(token, timePeriod);
  }

  @Post('sync')
  triggerSync(@Param('token') token: string) {
    return this.dashboardService.triggerSync(token);
  }

  @Get('sync-status')
  getSyncStatus(@Param('token') token: string) {
    return this.dashboardService.getSyncStatus(token);
  }

  @Post('integrations/calendly')
  updateCalendly(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.dashboardService.updateIntegration(token, 'calendly', dto);
  }

  @Post('integrations/close')
  updateClose(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.dashboardService.updateIntegration(token, 'close', dto);
  }

  @Post('integrations/stripe')
  updateStripe(
    @Param('token') token: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.dashboardService.updateIntegration(token, 'stripe', dto);
  }
}

