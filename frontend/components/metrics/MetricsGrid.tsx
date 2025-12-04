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

  const capValue = (value: number | null): { value: number | null; isCapped: boolean } => {
    if (value === null) return { value: null, isCapped: false };
    if (value > 100) return { value: 100, isCapped: true };
    return { value, isCapped: false };
  };

  const bookingRate = capValue(metrics.bookingRate);
  const cancellationRate = capValue(metrics.cancellationRate);
  const showUpRate = capValue(metrics.showUpRate);
  const closeRate = capValue(metrics.closeRate);
  const crmHygiene = capValue(metrics.crmHygiene);

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
        value={bookingRate.value}
        unit="%"
        subtitle="Booked calls / Total leads"
        isLoading={isLoading}
        target="> 15%"
        targetStatus={checkTarget(bookingRate.value, 15, 'greater')}
        isCapped={bookingRate.isCapped}
      />
      <MetricCard
        title="Cancellation Rate"
        value={cancellationRate.value}
        unit="%"
        subtitle="Cancelled calls / Booked calls"
        isLoading={isLoading}
        target="< 20%"
        targetStatus={checkTarget(cancellationRate.value, 20, 'less')}
        isCapped={cancellationRate.isCapped}
      />
      <MetricCard
        title="Show Up Rate"
        value={showUpRate.value}
        unit="%"
        subtitle="Customers who showed up / Total scheduled calls"
        isLoading={isLoading}
        target="> 60%"
        targetStatus={checkTarget(showUpRate.value, 60, 'greater')}
        isCapped={showUpRate.isCapped}
      />
      <MetricCard
        title="Close Rate"
        value={closeRate.value}
        unit="%"
        subtitle="Won deals / Show ups"
        isLoading={isLoading}
        target="> 35%"
        targetStatus={checkTarget(closeRate.value, 35, 'greater')}
        isCapped={closeRate.isCapped}
      />
      <MetricCard
        title="CRM Hygiene"
        value={crmHygiene.value}
        unit="%"
        subtitle="Data quality score"
        isLoading={isLoading}
        target="> 80%"
        targetStatus={checkTarget(crmHygiene.value, 80, 'greater')}
        isCapped={crmHygiene.isCapped}
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

