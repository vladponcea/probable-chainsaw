import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TimePeriod =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | '30d'
  | 'mtd'
  | 'qtd'
  | 'ytd'
  | 'custom';

type DateFilter = {
  gte?: Date;
  lte?: Date;
};

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(
    timePeriod: TimePeriod,
    customStartDate?: string,
    customEndDate?: string,
  ): DateFilter {
    const now = new Date();

    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const endOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const startOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), 1);

    const startOfQuarter = (date: Date) => {
      const quarter = Math.floor(date.getMonth() / 3) * 3;
      return new Date(date.getFullYear(), quarter, 1);
    };

    const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

    let start: Date | undefined;
    let end: Date | undefined;

    switch (timePeriod) {
      case 'today':
        start = startOfDay(now);
        end = now;
        break;
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      }
      case 'last7': {
        start = startOfDay(new Date(now));
        start.setDate(start.getDate() - 7);
        end = now;
        break;
      }
      case 'last30':
      case '30d': {
        start = startOfDay(new Date(now));
        start.setDate(start.getDate() - 30);
        end = now;
        break;
      }
      case 'mtd':
        start = startOfMonth(now);
        end = now;
        break;
      case 'qtd':
        start = startOfQuarter(now);
        end = now;
        break;
      case 'ytd':
        start = startOfYear(now);
        end = now;
        break;
      case 'custom':
        if (customStartDate) {
          start = startOfDay(new Date(customStartDate));
        }
        if (customEndDate) {
          end = endOfDay(new Date(customEndDate));
        }
        break;
      case 'all':
      default:
        return {};
    }

    const filter: DateFilter = {};
    if (start) filter.gte = start;
    if (end) filter.lte = end;
    return filter;
  }

  private isDateWithinFilter(date: Date, filter: DateFilter): boolean {
    if (filter.gte && date < filter.gte) return false;
    if (filter.lte && date > filter.lte) return false;
    return true;
  }

  async getSpeedToLead(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number | null> {
    const allLeads = await this.prisma.lead.findMany({
      where: {
        clientId,
        createdAt: dateFilter,
      },
    });

    const leadsWithContact = allLeads.filter(
      (lead) => lead.firstContactDate !== null,
    );

    const validLeads = leadsWithContact.filter((lead) => {
      if (!lead.firstContactDate) return false;
      const timeDiff = Math.abs(
        lead.firstContactDate.getTime() - lead.createdAt.getTime(),
      );
      const oneHour = 60 * 60 * 1000;
      return timeDiff >= oneHour;
    });

    if (validLeads.length === 0) return null;

    const totalHours = validLeads.reduce((sum, lead) => {
      if (!lead.firstContactDate) return sum;
      const diffMs =
        lead.firstContactDate.getTime() - lead.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return totalHours / validLeads.length;
  }

  async getFailedPaymentRate(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number> {
    const [failed, total] = await Promise.all([
      this.prisma.payment.count({
        where: {
          clientId,
          status: 'failed',
          paidAt: dateFilter,
        },
      }),
      this.prisma.payment.count({
        where: {
          clientId,
          paidAt: dateFilter,
        },
      }),
    ]);

    if (total === 0) return 0;
    return (failed / total) * 100;
  }

  async getBookingRate(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number | null> {
    const [bookedCalls, totalLeads] = await Promise.all([
      this.prisma.bookedCall.count({
        where: {
          clientId,
          scheduledAt: dateFilter,
        },
      }),
      this.prisma.lead.count({
        where: {
          clientId,
          createdAt: dateFilter,
        },
      }),
    ]);

    if (totalLeads === 0) return null;
    return (bookedCalls / totalLeads) * 100;
  }

  async getCancellationRate(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number | null> {
    const [cancelled, booked] = await Promise.all([
      this.prisma.bookedCall.count({
        where: {
          clientId,
          status: 'cancelled',
          scheduledAt: dateFilter,
        },
      }),
      this.prisma.bookedCall.count({
        where: {
          clientId,
          scheduledAt: dateFilter,
        },
      }),
    ]);

    if (booked === 0) return null;
    return (cancelled / booked) * 100;
  }

  async getCRMHygiene(clientId: string): Promise<number> {
    const [leadsWithoutStatus, totalLeads, totalDeals] = await Promise.all([
      this.prisma.lead.count({
        where: {
          clientId,
          status: null,
        },
      }),
      this.prisma.lead.count({
        where: { clientId },
      }),
      this.prisma.deal.count({
        where: { clientId },
      }),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stuckDeals = await this.prisma.deal.count({
      where: {
        clientId,
        OR: [
          {
            lastStageChangeDate: {
              lt: sevenDaysAgo,
            },
          },
          {
            lastStageChangeDate: null,
            createdAt: {
              lt: sevenDaysAgo,
            },
          },
        ],
      },
    });

    const dealsWithoutAmount = await this.prisma.deal.count({
      where: {
        clientId,
        amount: null,
      },
    });

    const totalIssues = leadsWithoutStatus + stuckDeals + dealsWithoutAmount;
    const totalItems = totalLeads + totalDeals;

    if (totalItems === 0) return 100;

    const hygieneScore = 100 - (totalIssues / totalItems) * 100;
    return Math.max(0, Math.min(100, hygieneScore));
  }

  async getAverageDealValue(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number | null> {
    const totalRevenue = await this.getTotalRevenue(clientId, dateFilter);

    const wonDealsCount = await this.prisma.deal.count({
      where: {
        clientId,
        status: 'won',
        createdAt: dateFilter,
      },
    });

    if (wonDealsCount === 0) return null;

    return totalRevenue / wonDealsCount;
  }

  async getPipelineVelocity(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number | null> {
    const wonDeals = await this.prisma.deal.findMany({
      where: {
        clientId,
        status: 'won',
      },
      include: {
        leads: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
    });

    const validDeals = wonDeals.filter((deal) => {
      if (deal.leads.length === 0 || !deal.leads[0]) {
        return false;
      }

      const wonDate = deal.lastStageChangeDate || deal.updatedAt;
      return this.isDateWithinFilter(wonDate, dateFilter);
    });

    if (validDeals.length === 0) return null;

    const totalDays = validDeals.reduce((sum, deal) => {
      const leadCreated = deal.leads[0].createdAt;
      const wonDate = deal.lastStageChangeDate || deal.updatedAt;
      const diffMs = wonDate.getTime() - leadCreated.getTime();
      return sum + diffMs / (1000 * 60 * 60 * 24);
    }, 0);

    return totalDays / validDeals.length;
  }

  async getTotalRevenue(
    clientId: string,
    dateFilter: DateFilter,
  ): Promise<number> {
    const payments = await this.prisma.payment.findMany({
      where: {
        clientId,
        status: 'succeeded',
        paidAt: dateFilter,
      },
    });

    return payments.reduce((sum, payment) => {
      return sum + payment.amountCents / 100;
    }, 0);
  }

  async getAllMetrics(
    clientId: string,
    timePeriod: TimePeriod,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<{
    speedToLead: number | null;
    failedPaymentRate: number;
    bookingRate: number | null;
    cancellationRate: number | null;
    crmHygiene: number;
    averageDealValue: number | null;
    pipelineVelocity: number | null;
    totalRevenue: number;
  }> {
    const dateFilter = this.getDateFilter(
      timePeriod,
      customStartDate,
      customEndDate,
    );

    const [
      speedToLead,
      failedPaymentRate,
      bookingRate,
      cancellationRate,
      crmHygiene,
      averageDealValue,
      pipelineVelocity,
      totalRevenue,
    ] = await Promise.all([
      this.getSpeedToLead(clientId, dateFilter),
      this.getFailedPaymentRate(clientId, dateFilter),
      this.getBookingRate(clientId, dateFilter),
      this.getCancellationRate(clientId, dateFilter),
      this.getCRMHygiene(clientId),
      this.getAverageDealValue(clientId, dateFilter),
      this.getPipelineVelocity(clientId, dateFilter),
      this.getTotalRevenue(clientId, dateFilter),
    ]);

    return {
      speedToLead,
      failedPaymentRate,
      bookingRate,
      cancellationRate,
      crmHygiene,
      averageDealValue,
      pipelineVelocity,
      totalRevenue,
    };
  }
}

