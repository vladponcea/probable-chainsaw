import { Controller, Post, Param, Query } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Controller('dashboard/:token/mock-data')
export class MockDataController {
  constructor(private readonly mockDataService: MockDataService) {}

  @Post('generate')
  async generateMockData(
    @Param('token') token: string,
    @Query('count') count?: string,
  ) {
    try {
      const leadCount = count ? parseInt(count, 10) : 10;
      const result = await this.mockDataService.generateMockData(token, leadCount);
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to generate mock data',
        error: error.message,
      };
    }
  }
}

