import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TimePeriod = 'all' | '30d';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(timePeriod: TimePeriod): { gte?: Date } {
    if (timePeriod === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { gte: thirtyDaysAgo };
    }
    return {};
  }

  async getSpeedToLead(
    clientId: string,
    timePeriod: TimePeriod,
  ): Promise<number | null> {
    const dateFilter = this.getDateFilter(timePeriod);

    // Get all leads first to see what we have
    const allLeads = await this.prisma.lead.findMany({
      where: {
        clientId,
        createdAt: dateFilter,
      },
    });

    // Filter to leads that have firstContactDate set
    const leadsWithContact = allLeads.filter((lead) => lead.firstContactDate !== null);

    // Filter out leads where createdAt is within 1 hour of firstContactDate
    // (these are likely leads created at the same time as first contact)
    const validLeads = leadsWithContact.filter((lead) => {
      if (!lead.firstContactDate) return false;
      const timeDiff = Math.abs(
        lead.firstContactDate.getTime() - lead.createdAt.getTime(),
      );
      const oneHour = 60 * 60 * 1000;
      return timeDiff >= oneHour;
    });

    // Debug logging
    console.log(`[SpeedToLead] Client: ${clientId}, Period: ${timePeriod}`);
    console.log(`[SpeedToLead] Total leads: ${allLeads.length}, With firstContactDate: ${leadsWithContact.length}, Valid (>=1h diff): ${validLeads.length}`);

    if (validLeads.length === 0) {
      return null;
    }

    const totalHours = validLeads.reduce((sum, lead) => {
      if (!lead.firstContactDate) return sum;
      const diffMs =
        lead.firstContactDate.getTime() - lead.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60); // Convert to hours
    }, 0);

    const avgHours = totalHours / validLeads.length;
    console.log(`[SpeedToLead] Average: ${avgHours.toFixed(2)} hours`);
    return avgHours;
  }

  async getFailedPaymentRate(
    clientId: string,
    timePeriod: TimePeriod,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(timePeriod);

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
    timePeriod: TimePeriod,
  ): Promise<number | null> {
    const dateFilter = this.getDateFilter(timePeriod);

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
    timePeriod: TimePeriod,
  ): Promise<number | null> {
    const dateFilter = this.getDateFilter(timePeriod);

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

    // Deals stuck in same stage for >7 days
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

    // Deals without amount
    const dealsWithoutAmount = await this.prisma.deal.count({
      where: {
        clientId,
        amount: null,
      },
    });

    // Calculate total issues
    const totalIssues = leadsWithoutStatus + stuckDeals + dealsWithoutAmount;
    const totalItems = totalLeads + totalDeals;

    if (totalItems === 0) return 100; // Perfect score if no data

    const hygieneScore = 100 - (totalIssues / totalItems) * 100;
    return Math.max(0, Math.min(100, hygieneScore)); // Clamp between 0-100
  }

  async getAverageDealValue(
    clientId: string,
    timePeriod: TimePeriod,
  ): Promise<number | null> {
    const dateFilter = this.getDateFilter(timePeriod);

    // Get total cash collected from Stripe
    const totalRevenue = await this.getTotalRevenue(clientId, timePeriod);

    // Get count of won deals from Close CRM
    const wonDealsCount = await this.prisma.deal.count({
      where: {
        clientId,
        status: 'won',
        createdAt: dateFilter,
      },
    });

    if (wonDealsCount === 0) return null;

    // Average Deal Value = Total Stripe Revenue / Number of Won Deals
    return totalRevenue / wonDealsCount;
  }

  async getPipelineVelocity(
    clientId: string,
    timePeriod: TimePeriod,
  ): Promise<number | null> {
    // Get all won deals
    const allWonDeals = await this.prisma.deal.findMany({
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

    // Debug: log what we found
    console.log(`[PipelineVelocity Debug] Client: ${clientId}, Total won deals: ${allWonDeals.length}`);

    // Filter deals by when they were marked as won (within time period)
    const validDeals = allWonDeals.filter((deal) => {
      if (deal.leads.length === 0 || !deal.leads[0]) {
        console.log(`[PipelineVelocity Debug] Deal ${deal.id} has no linked leads`);
        return false;
      }

      // Use lastStageChangeDate if available, otherwise use updatedAt
      const wonDate = deal.lastStageChangeDate || deal.updatedAt;
      
      // If time period filter is set, check if won date is within period
      if (timePeriod === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return wonDate >= thirtyDaysAgo;
      }
      
      return true; // All time - include all won deals
    });

    console.log(`[PipelineVelocity Debug] Valid deals with leads: ${validDeals.length}`);

    if (validDeals.length === 0) return null;

    const totalDays = validDeals.reduce((sum, deal) => {
      const leadCreated = deal.leads[0].createdAt;
      // Use lastStageChangeDate (when marked as won) or updatedAt as fallback
      const wonDate = deal.lastStageChangeDate || deal.updatedAt;
      const diffMs = wonDate.getTime() - leadCreated.getTime();
      const days = diffMs / (1000 * 60 * 60 * 24);
      console.log(`[PipelineVelocity Debug] Deal ${deal.id}: Lead created ${leadCreated}, Won ${wonDate}, Days: ${days}`);
      return sum + days;
    }, 0);

    return totalDays / validDeals.length;
  }

  async getTotalRevenue(
    clientId: string,
    timePeriod: TimePeriod,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(timePeriod);

    const payments = await this.prisma.payment.findMany({
      where: {
        clientId,
        status: 'succeeded',
        paidAt: dateFilter,
      },
    });

    // Convert cents to dollars and sum
    return payments.reduce((sum, payment) => {
      return sum + payment.amountCents / 100;
    }, 0);
  }

  async getAllMetrics(
    clientId: string,
    timePeriod: TimePeriod,
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
      this.getSpeedToLead(clientId, timePeriod),
      this.getFailedPaymentRate(clientId, timePeriod),
      this.getBookingRate(clientId, timePeriod),
      this.getCancellationRate(clientId, timePeriod),
      this.getCRMHygiene(clientId),
      this.getAverageDealValue(clientId, timePeriod),
      this.getPipelineVelocity(clientId, timePeriod),
      this.getTotalRevenue(clientId, timePeriod),
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

