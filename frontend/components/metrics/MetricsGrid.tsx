'use client';

import MetricCard from './MetricCard';
import { DashboardMetrics } from '@/lib/api';

interface MetricsGridProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export default function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Speed to Lead"
        value={metrics.speedToLead}
        unit="hours"
        subtitle="Average time from lead creation to first contact"
        isLoading={isLoading}
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
      />
      <MetricCard
        title="Cancellation Rate"
        value={metrics.cancellationRate}
        unit="%"
        subtitle="Cancelled calls / Booked calls"
        isLoading={isLoading}
      />
      <MetricCard
        title="Show Up Rate"
        value={metrics.showUpRate}
        unit="%"
        subtitle="Customers who showed up / Total scheduled calls"
        isLoading={isLoading}
      />
      <MetricCard
        title="Close Rate"
        value={metrics.closeRate}
        unit="%"
        subtitle="Won deals / Show ups"
        isLoading={isLoading}
      />
      <MetricCard
        title="CRM Hygiene"
        value={metrics.crmHygiene}
        unit="%"
        subtitle="Data quality score"
        isLoading={isLoading}
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
      <MetricCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        unit="$"
        subtitle="Total cash collected"
        isLoading={isLoading}
      />
    </div>
  );
}

