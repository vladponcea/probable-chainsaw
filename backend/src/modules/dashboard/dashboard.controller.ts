import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const normalized = this.normalizePeriod(period);

    if (
      normalized === 'custom' &&
      (!startDate || !endDate)
    ) {
      throw new BadRequestException(
        'Custom date range requires startDate and endDate',
      );
    }

    return this.dashboardService.getMetrics(
      token,
      normalized,
      startDate,
      endDate,
    );
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

  private normalizePeriod(value?: string): TimePeriod {
    if (!value) {
      return 'mtd';
    }

    const normalized = value.toLowerCase();
    switch (normalized) {
      case 'all':
        return 'all';
      case 'today':
        return 'today';
      case 'yesterday':
        return 'yesterday';
      case 'last7':
        return 'last7';
      case 'last30':
      case '30d':
        return 'last30';
      case 'mtd':
        return 'mtd';
      case 'qtd':
        return 'qtd';
      case 'ytd':
        return 'ytd';
      case 'custom':
        return 'custom';
      default:
        return 'mtd';
    }
  }
}

