'use client';

import MetricCard from './MetricCard';
import { DashboardMetrics } from '@/lib/api';

interface MetricsGridProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
  avgLeadsPerMonth: number;
}

export default function MetricsGrid({ metrics, isLoading, avgLeadsPerMonth }: MetricsGridProps) {
  const checkTarget = (
    value: number | null,
    target: number,
    operator: 'less' | 'greater'
  ): 'met' | 'below' | null => {
    if (value === null) return null;
    const isMet = operator === 'less' ? value < target : value > target;
    return isMet ? 'met' : 'below';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        unit="$"
        subtitle="Total cash collected"
        isLoading={isLoading}
      />
      <MetricCard
        title="Avg Leads/Month"
        value={avgLeadsPerMonth}
        unit=""
        subtitle="Average leads per month"
        isLoading={isLoading}
      />
      <MetricCard
        title="Speed to Lead"
        value={metrics.speedToLead !== null ? metrics.speedToLead * 60 : null}
        unit="min"
        subtitle="Average time from lead creation to first contact"
        isLoading={isLoading}
        target="< 2min"
        targetStatus={
          metrics.speedToLead !== null
            ? checkTarget(metrics.speedToLead * 60, 2, 'less') // Convert hours to minutes
            : null
        }
      />
      <MetricCard
        title="Failed Payment Amount (Yearly)"
        value={metrics.failedPaymentAmountYearly}
        unit="$"
        subtitle="Projected yearly amount of failed payments"
        isLoading={isLoading}
      />
      <MetricCard
        title="Booking Rate"
        value={metrics.bookingRate}
        unit="%"
        subtitle="Booked calls / Total leads"
        isLoading={isLoading}
        target="> 15%"
        targetStatus={checkTarget(metrics.bookingRate, 15, 'greater')}
      />
      <MetricCard
        title="Cancellation Rate"
        value={metrics.cancellationRate}
        unit="%"
        subtitle="Cancelled calls / Booked calls"
        isLoading={isLoading}
        target="< 20%"
        targetStatus={checkTarget(metrics.cancellationRate, 20, 'less')}
      />
      <MetricCard
        title="Show Up Rate"
        value={metrics.showUpRate}
        unit="%"
        subtitle="Customers who showed up / Total scheduled calls"
        isLoading={isLoading}
        target="> 60%"
        targetStatus={checkTarget(metrics.showUpRate, 60, 'greater')}
      />
      <MetricCard
        title="Close Rate"
        value={metrics.closeRate}
        unit="%"
        subtitle="Won deals / Show ups"
        isLoading={isLoading}
        target="> 35%"
        targetStatus={checkTarget(metrics.closeRate, 35, 'greater')}
      />
      <MetricCard
        title="CRM Hygiene"
        value={metrics.crmHygiene}
        unit="%"
        subtitle="Data quality score"
        isLoading={isLoading}
        target="> 80%"
        targetStatus={checkTarget(metrics.crmHygiene, 80, 'greater')}
      />
      <MetricCard
        title="Average Deal Value"
        value={metrics.averageDealValue}
        unit="$"
        subtitle="Average value of closed deals"
        isLoading={isLoading}
      />
      <MetricCard
        title="Pipeline Velocity"
        value={metrics.pipelineVelocity}
        unit="days"
        subtitle="Average time from lead to closed deal"
        isLoading={isLoading}
      />
    </div>
  );
}

