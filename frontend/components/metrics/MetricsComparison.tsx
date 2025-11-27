'use client';

import { useState, useMemo } from 'react';
import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface MetricsComparisonProps {
  metrics: DashboardMetrics;
}

interface Adjustments {
  bookedCalls: number; // percentage change (20 to 200)
  showUpRate: number; // percentage points change (20 to 30)
  closeRate: number; // percentage points change (20 to 30)
  cancellationRate: number; // percentage points change (20 to 30)
  aov: number; // percentage change (0, not adjustable)
}

export default function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({
    bookedCalls: 20,
    showUpRate: 20,
    closeRate: 20,
    cancellationRate: 20,
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
      bookedCalls: 20,
      showUpRate: 20,
      closeRate: 20,
      cancellationRate: 20,
      aov: 0,
    });
  };

  const hasAdjustments = 
    adjustments.bookedCalls !== 20 ||
    adjustments.showUpRate !== 20 ||
    adjustments.closeRate !== 20 ||
    adjustments.cancellationRate !== 20;

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
          Metrics Calculator
        </h2>
        <p className="text-slate-400 font-medium">
          Adjust key metrics to see projected outcomes
        </p>
      </div>

      {/* Sliders and Projected Metrics Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sliders Section */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/20 p-6 border border-slate-800 lg:w-1/3">
          <div className="space-y-6">
          {/* Booked Calls Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Booked Calls
              </label>
              <div className="text-sm text-slate-400">
                <span className="font-bold text-primary-400">
                  {adjustments.bookedCalls > 0 ? '+' : ''}
                  {adjustments.bookedCalls.toFixed(0)}%
                </span>
                {metrics.bookedCalls > 0 && (
                  <span className="ml-2 text-slate-500">
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
              min="20"
              max="200"
              value={adjustments.bookedCalls}
              onChange={(e) =>
                handleAdjustmentChange('bookedCalls', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>+20%</span>
              <span>+110%</span>
              <span>+200%</span>
            </div>
          </div>

          {/* Show Up Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Show Up Rate
              </label>
              <div className="text-sm text-slate-400">
                <span className="font-bold text-primary-400">
                  {adjustments.showUpRate > 0 ? '+' : ''}
                  {adjustments.showUpRate.toFixed(1)}pp
                </span>
                {metrics.showUpRate !== null && (
                  <span className="ml-2 text-slate-500">
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
              min="20"
              max="30"
              step="0.1"
              value={adjustments.showUpRate}
              onChange={(e) =>
                handleAdjustmentChange('showUpRate', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>+20pp</span>
              <span>+25pp</span>
              <span>+30pp</span>
            </div>
          </div>

          {/* Close Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Close Rate
              </label>
              <div className="text-sm text-slate-400">
                <span className="font-bold text-primary-400">
                  {adjustments.closeRate > 0 ? '+' : ''}
                  {adjustments.closeRate.toFixed(1)}pp
                </span>
                {metrics.closeRate !== null && (
                  <span className="ml-2 text-slate-500">
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
              min="20"
              max="30"
              step="0.1"
              value={adjustments.closeRate}
              onChange={(e) =>
                handleAdjustmentChange('closeRate', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>+20pp</span>
              <span>+25pp</span>
              <span>+30pp</span>
            </div>
          </div>

          {/* Cancellation Rate Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Cancellation Rate
              </label>
              <div className="text-sm text-slate-400">
                <span className="font-bold text-primary-400">
                  {adjustments.cancellationRate > 0 ? '+' : ''}
                  {adjustments.cancellationRate.toFixed(1)}pp
                </span>
                {metrics.cancellationRate !== null && (
                  <span className="ml-2 text-slate-500">
                    ({metrics.cancellationRate.toFixed(1)}% →{' '}
                    {Math.min(
                      100,
                      Math.max(0, metrics.cancellationRate + adjustments.cancellationRate),
                    ).toFixed(1)}
                    %)
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="30"
              step="0.1"
              value={adjustments.cancellationRate}
              onChange={(e) =>
                handleAdjustmentChange('cancellationRate', Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#0284c7' }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>+20pp</span>
              <span>+25pp</span>
              <span>+30pp</span>
            </div>
          </div>
          </div>

          {/* Reset Button */}
          {hasAdjustments && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-lg shadow-black/20"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Projected Metrics Grid */}
        {hasAdjustments && (
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-4">
              Projected Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Failed Payment Amount (Yearly)"
                value={projectedMetrics.failedPaymentAmountYearly}
                unit="$"
                subtitle="Projected yearly amount of failed payments"
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
  let newBookedCalls = Math.max(
    0,
    baseBookedCalls * (1 + adjustments.bookedCalls / 100),
  );

  // Apply cancellation rate adjustment
  // If cancellation rate increases, fewer calls actually happen
  let newCancellationRate: number | null = null;
  if (current.cancellationRate !== null) {
    newCancellationRate = Math.min(100, Math.max(0, current.cancellationRate + adjustments.cancellationRate));
  } else if (adjustments.cancellationRate !== 20) {
    // If current is null but user made an adjustment, use the adjustment as absolute value
    newCancellationRate = Math.min(100, Math.max(0, adjustments.cancellationRate));
  }

  // Adjust booked calls based on cancellation rate change
  // If cancellation rate goes up, effective booked calls go down
  if (newCancellationRate !== null && current.cancellationRate !== null) {
    const cancellationRateChange = newCancellationRate - current.cancellationRate;
    // Reduce effective booked calls by the cancellation rate increase
    // e.g., if cancellation rate goes from 10% to 15% (+5pp), we lose 5% of booked calls
    const cancellationImpact = cancellationRateChange / 100;
    newBookedCalls = Math.max(0, newBookedCalls * (1 - cancellationImpact));
  } else if (newCancellationRate !== null && current.cancellationRate === null) {
    // If we're setting a cancellation rate where there wasn't one before
    // Apply the cancellation rate to reduce effective booked calls
    const cancellationImpact = newCancellationRate / 100;
    newBookedCalls = Math.max(0, newBookedCalls * (1 - cancellationImpact));
  }

  // Calculate new show up rate (clamped to 0-100%)
  // Always calculate a show up rate for projections to enable cascading calculations
  let newShowUpRate: number;
  if (current.showUpRate !== null) {
    // Add adjustment to current rate (adjustments are in percentage points)
    newShowUpRate = Math.min(
      100,
      Math.max(0, current.showUpRate + adjustments.showUpRate),
    );
  } else {
    // If current is null, use the adjustment value as absolute rate
    // Since slider goes from +20pp to +30pp, interpret as 20% to 30% when current is null
    newShowUpRate = Math.min(100, Math.max(0, adjustments.showUpRate));
  }

  // Calculate new show ups based on new booked calls and new show up rate
  // This is the key connection: more booked calls → more show ups
  const newShowUps = newBookedCalls > 0
    ? Math.round((newBookedCalls * newShowUpRate) / 100)
    : 0;

  // Calculate new close rate (clamped to 0-100%)
  // Always calculate a close rate for projections to enable cascading calculations
  let newCloseRate: number;
  if (current.closeRate !== null) {
    // Add adjustment to current rate (adjustments are in percentage points)
    newCloseRate = Math.min(100, Math.max(0, current.closeRate + adjustments.closeRate));
  } else {
    // If current is null, use the adjustment value as absolute rate
    // Since slider goes from +20pp to +30pp, interpret as 20% to 30% when current is null
    newCloseRate = Math.min(100, Math.max(0, adjustments.closeRate));
  }

  // Calculate new won deals based on new show ups and new close rate
  // This is the key connection: more show ups → more won deals
  const newWonDeals = newShowUps > 0
    ? Math.round((newShowUps * newCloseRate) / 100)
    : 0;

  // Calculate new AOV
  // Use AOV from the selected timeframe directly (this is the value of a closed deal)
  // Apply AOV adjustment if needed
  let newAOV: number | null = null;
  
  // Priority 1: Use current AOV from selected timeframe (this is what we want)
  if (current.averageDealValue !== null) {
    newAOV = current.averageDealValue * (1 + adjustments.aov / 100);
  }
  // Priority 2: If AOV is null, try to calculate from current revenue/wonDeals as fallback
  else if (current.totalRevenue > 0 && current.wonDeals > 0) {
    const baseAOV = current.totalRevenue / current.wonDeals;
    newAOV = baseAOV * (1 + adjustments.aov / 100);
  }

  // Calculate new total revenue (cash collected)
  // This is the key connection: more won deals → more cash collected
  // Cash collected = won deals × AOV (from selected timeframe)
  let newTotalRevenue = 0;
  if (newWonDeals > 0) {
    // Use AOV from selected timeframe
    if (newAOV !== null && newAOV > 0) {
      newTotalRevenue = newWonDeals * newAOV;
    } 
    // Fallback: if new AOV is null/0, try to use current AOV directly
    else if (current.averageDealValue !== null && current.averageDealValue > 0) {
      newTotalRevenue = newWonDeals * current.averageDealValue;
    }
    // Last resort: calculate from current revenue if available
    else if (current.totalRevenue > 0 && current.wonDeals > 0) {
      const estimatedAOV = current.totalRevenue / current.wonDeals;
      newTotalRevenue = newWonDeals * estimatedAOV;
    }
  }

  // Calculate new booking rate
  const newBookingRate =
    current.totalLeads > 0 ? (newBookedCalls / current.totalLeads) * 100 : null;

  return {
    speedToLead: current.speedToLead, // Unchanged
    failedPaymentAmountYearly: current.failedPaymentAmountYearly, // Unchanged
    bookingRate: newBookingRate,
    cancellationRate: newCancellationRate,
    showUpRate: newShowUpRate, // Always a number now (never null)
    closeRate: newCloseRate, // Always a number now (never null)
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

