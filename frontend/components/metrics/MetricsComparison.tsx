'use client';

import { useState, useMemo } from 'react';
import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface MetricsComparisonProps {
  metrics: DashboardMetrics;
}

interface Adjustments {
  bookedCalls: number; // percentage change (-50 to 200)
  showUpRate: number; // percentage points change (-20 to 30)
  closeRate: number; // percentage points change (-20 to 30)
  aov: number; // percentage change (-50 to 200)
}

export default function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({
    bookedCalls: 0,
    showUpRate: 0,
    closeRate: 0,
    aov: 0,
  });

  const projectedMetrics = useMemo(() => {
    return calculateProjectedMetrics(metrics, adjustments);
  }, [metrics, adjustments]);

  const handleAdjustmentChange = (
    key: keyof Adjustments,
    value: number,
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setAdjustments({
      bookedCalls: 0,
      showUpRate: 0,
      closeRate: 0,
      aov: 0,
    });
  };

  const hasAdjustments = Object.values(adjustments).some((val) => val !== 0);

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Metrics Calculator
        </h2>
        <p className="text-gray-600">
          Adjust key metrics to see projected outcomes
        </p>
      </div>

      {/* Sliders Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <div className="space-y-6">
          {/* Booked Calls Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Booked Calls
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">
                  {adjustments.bookedCalls > 0 ? '+' : ''}
                  {adjustments.bookedCalls.toFixed(0)}%
                </span>
                {metrics.bookedCalls > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({metrics.bookedCalls} →{' '}
                    {Math.round(
                      metrics.bookedCalls * (1 + adjustments.bookedCalls / 100),
                    )}
                    )
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-50"
              max="200"
              value={adjustments.bookedCalls}
              onChange={(e) =>
                handleAdjustmentChange('bookedCalls', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+200%</span>
            </div>
          </div>

          {/* Show Up Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Show Up Rate
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">
                  {adjustments.showUpRate > 0 ? '+' : ''}
                  {adjustments.showUpRate.toFixed(1)}pp
                </span>
                {metrics.showUpRate !== null && (
                  <span className="ml-2 text-gray-500">
                    ({metrics.showUpRate.toFixed(1)}% →{' '}
                    {Math.min(
                      100,
                      Math.max(0, metrics.showUpRate + adjustments.showUpRate),
                    ).toFixed(1)}
                    %)
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="0.1"
              value={adjustments.showUpRate}
              onChange={(e) =>
                handleAdjustmentChange('showUpRate', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-20pp</span>
              <span>0pp</span>
              <span>+30pp</span>
            </div>
          </div>

          {/* Close Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Close Rate
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">
                  {adjustments.closeRate > 0 ? '+' : ''}
                  {adjustments.closeRate.toFixed(1)}pp
                </span>
                {metrics.closeRate !== null && (
                  <span className="ml-2 text-gray-500">
                    ({metrics.closeRate.toFixed(1)}% →{' '}
                    {Math.min(
                      100,
                      Math.max(0, metrics.closeRate + adjustments.closeRate),
                    ).toFixed(1)}
                    %)
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="0.1"
              value={adjustments.closeRate}
              onChange={(e) =>
                handleAdjustmentChange('closeRate', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-20pp</span>
              <span>0pp</span>
              <span>+30pp</span>
            </div>
          </div>

          {/* AOV Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Average Deal Value (AOV)
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">
                  {adjustments.aov > 0 ? '+' : ''}
                  {adjustments.aov.toFixed(0)}%
                </span>
                {metrics.averageDealValue !== null && (
                  <span className="ml-2 text-gray-500">
                    (${metrics.averageDealValue.toFixed(2)} → $
                    {(
                      metrics.averageDealValue *
                      (1 + adjustments.aov / 100)
                    ).toFixed(2)}
                    )
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-50"
              max="200"
              value={adjustments.aov}
              onChange={(e) =>
                handleAdjustmentChange('aov', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+200%</span>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        {hasAdjustments && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Projected Metrics Grid */}
      {hasAdjustments && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Projected Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Speed to Lead"
              value={projectedMetrics.speedToLead}
              unit="hours"
              subtitle="Average time from lead creation to first contact"
            />
            <MetricCard
              title="Failed Payment Rate"
              value={projectedMetrics.failedPaymentRate}
              unit="%"
              subtitle="Percentage of failed payments"
            />
            <MetricCard
              title="Booking Rate"
              value={projectedMetrics.bookingRate}
              unit="%"
              subtitle="Booked calls / Total leads"
              trend={
                projectedMetrics.bookingRate !== null &&
                metrics.bookingRate !== null &&
                projectedMetrics.bookingRate > metrics.bookingRate
                  ? 'up'
                  : projectedMetrics.bookingRate !== null &&
                      metrics.bookingRate !== null &&
                      projectedMetrics.bookingRate < metrics.bookingRate
                    ? 'down'
                    : 'neutral'
              }
            />
            <MetricCard
              title="Cancellation Rate"
              value={projectedMetrics.cancellationRate}
              unit="%"
              subtitle="Cancelled calls / Booked calls"
            />
            <MetricCard
              title="Show Up Rate"
              value={projectedMetrics.showUpRate}
              unit="%"
              subtitle="Customers who showed up / Total scheduled calls"
              trend={
                projectedMetrics.showUpRate !== null &&
                metrics.showUpRate !== null &&
                projectedMetrics.showUpRate > metrics.showUpRate
                  ? 'up'
                  : projectedMetrics.showUpRate !== null &&
                      metrics.showUpRate !== null &&
                      projectedMetrics.showUpRate < metrics.showUpRate
                    ? 'down'
                    : 'neutral'
              }
            />
            <MetricCard
              title="Close Rate"
              value={projectedMetrics.closeRate}
              unit="%"
              subtitle="Won deals / Show ups"
              trend={
                projectedMetrics.closeRate !== null &&
                metrics.closeRate !== null &&
                projectedMetrics.closeRate > metrics.closeRate
                  ? 'up'
                  : projectedMetrics.closeRate !== null &&
                      metrics.closeRate !== null &&
                      projectedMetrics.closeRate < metrics.closeRate
                    ? 'down'
                    : 'neutral'
              }
            />
            <MetricCard
              title="CRM Hygiene"
              value={projectedMetrics.crmHygiene}
              unit="%"
              subtitle="Data quality score"
            />
            <MetricCard
              title="Average Deal Value"
              value={projectedMetrics.averageDealValue}
              unit="$"
              subtitle="Average value of closed deals"
              trend={
                projectedMetrics.averageDealValue !== null &&
                metrics.averageDealValue !== null &&
                projectedMetrics.averageDealValue > metrics.averageDealValue
                  ? 'up'
                  : projectedMetrics.averageDealValue !== null &&
                      metrics.averageDealValue !== null &&
                      projectedMetrics.averageDealValue < metrics.averageDealValue
                    ? 'down'
                    : 'neutral'
              }
            />
            <MetricCard
              title="Pipeline Velocity"
              value={projectedMetrics.pipelineVelocity}
              unit="days"
              subtitle="Average time from lead to closed deal"
            />
            <MetricCard
              title="Total Revenue"
              value={projectedMetrics.totalRevenue}
              unit="$"
              subtitle="Total cash collected"
              trend={
                projectedMetrics.totalRevenue > metrics.totalRevenue
                  ? 'up'
                  : projectedMetrics.totalRevenue < metrics.totalRevenue
                    ? 'down'
                    : 'neutral'
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function calculateProjectedMetrics(
  current: DashboardMetrics,
  adjustments: Adjustments,
): DashboardMetrics {
  // Determine base booked calls - use raw count if available, otherwise derive from booking rate
  let baseBookedCalls = current.bookedCalls;
  if (baseBookedCalls === 0 && current.bookingRate !== null && current.totalLeads > 0) {
    // Derive from booking rate if raw count is 0
    baseBookedCalls = Math.round((current.totalLeads * current.bookingRate) / 100);
  }
  
  // If still 0, try to derive from show up rate and show ups
  if (baseBookedCalls === 0 && current.showUpRate !== null && current.showUps > 0) {
    baseBookedCalls = Math.round((current.showUps * 100) / current.showUpRate);
  }

  // If still 0 but we have rates or user is making adjustments, use a reasonable base
  // This allows projections even when current booked calls is 0
  if (baseBookedCalls === 0) {
    if (current.totalLeads > 0) {
      // Use a small percentage of total leads as base to enable calculations
      // This represents "what if we had some bookings"
      const estimatedBookingRate = current.bookingRate && current.bookingRate > 0 
        ? current.bookingRate 
        : 10; // Default to 10% if no booking rate
      baseBookedCalls = Math.max(1, Math.round((current.totalLeads * estimatedBookingRate) / 100));
    } else if (adjustments.bookedCalls !== 0 || adjustments.showUpRate !== 0 || adjustments.closeRate !== 0) {
      // If user is making adjustments but we have no data, use a minimal base value
      baseBookedCalls = 1;
    }
  }

  // Calculate new booked calls with adjustment
  const newBookedCalls = Math.max(
    0,
    baseBookedCalls * (1 + adjustments.bookedCalls / 100),
  );

  // Calculate new show up rate (clamped to 0-100%)
  // If current is null but user adjusted, use 0 as base (or keep null if no adjustment)
  let newShowUpRate: number | null = null;
  if (current.showUpRate !== null) {
    newShowUpRate = Math.min(
      100,
      Math.max(0, current.showUpRate + adjustments.showUpRate),
    );
  } else if (adjustments.showUpRate !== 0) {
    // If current is null but user made an adjustment, use the adjustment as absolute value
    // Clamp between 0 and 100
    newShowUpRate = Math.min(100, Math.max(0, adjustments.showUpRate));
  }

  // Calculate new show ups based on new booked calls and new show up rate
  const newShowUps =
    newShowUpRate !== null && newBookedCalls > 0
      ? Math.round((newBookedCalls * newShowUpRate) / 100)
      : 0;

  // Calculate new close rate (clamped to 0-100%)
  let newCloseRate: number | null = null;
  if (current.closeRate !== null) {
    newCloseRate = Math.min(100, Math.max(0, current.closeRate + adjustments.closeRate));
  } else if (adjustments.closeRate !== 0) {
    // If current is null but user made an adjustment, use the adjustment as absolute value
    newCloseRate = Math.min(100, Math.max(0, adjustments.closeRate));
  }

  // Calculate new won deals based on new show ups and new close rate
  const newWonDeals =
    newCloseRate !== null && newShowUps > 0
      ? Math.round((newShowUps * newCloseRate) / 100)
      : 0;

  // Calculate new AOV
  let newAOV: number | null = null;
  if (current.averageDealValue !== null) {
    newAOV = current.averageDealValue * (1 + adjustments.aov / 100);
  } else if (adjustments.aov !== 0 && current.wonDeals > 0 && current.totalRevenue > 0) {
    // If AOV is null but we have revenue data, calculate base AOV
    const baseAOV = current.totalRevenue / current.wonDeals;
    newAOV = baseAOV * (1 + adjustments.aov / 100);
  }

  // Calculate new total revenue
  const newTotalRevenue = newWonDeals > 0 && newAOV !== null ? newWonDeals * newAOV : 0;

  // Calculate new booking rate
  const newBookingRate =
    current.totalLeads > 0 ? (newBookedCalls / current.totalLeads) * 100 : null;

  return {
    speedToLead: current.speedToLead, // Unchanged
    failedPaymentRate: current.failedPaymentRate, // Unchanged
    bookingRate: newBookingRate,
    cancellationRate: current.cancellationRate, // Unchanged (assume same cancellation rate)
    showUpRate: newShowUpRate,
    closeRate: newCloseRate,
    crmHygiene: current.crmHygiene, // Unchanged
    averageDealValue: newAOV,
    pipelineVelocity: current.pipelineVelocity, // Unchanged
    totalRevenue: newTotalRevenue,
    totalLeads: current.totalLeads, // Unchanged
    bookedCalls: Math.round(newBookedCalls),
    showUps: newShowUps,
    wonDeals: newWonDeals,
  };
}

