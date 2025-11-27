'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface MetricsComparisonProps {
  metrics: DashboardMetrics;
}

interface Adjustments {
  bookingRate: number; // percentage change (0 to 300)
  showUpRate: number; // percentage change (0 to 300)
  closeRate: number; // percentage change (0 to 300)
  aov: number; // percentage change (0 to 200)
}

export default function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({
    bookingRate: 25,
    showUpRate: 25,
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
      bookingRate: 25,
      showUpRate: 25,
      closeRate: 0,
      aov: 0,
    });
  };

  // Helper to calculate the projected dollar value for AOV slider display
  const currentAov = metrics.averageDealValue || 0;
  const projectedAovDisplay = currentAov * (1 + adjustments.aov / 100);

  return (
    <div className="mt-12 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
          Projected Growth
        </h2>
        <p className="text-slate-400 text-lg">
          Adjust key metrics to forecast your potential revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Section (Left) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/20">
            <div className="space-y-8">
              {/* Booking Rate Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Booking Rate
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    +{adjustments.bookingRate}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={adjustments.bookingRate}
                  onChange={(e) =>
                    handleAdjustmentChange('bookingRate', Number(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>Current</span>
                  <span>+300%</span>
                </div>
              </div>

              {/* Show Up Rate Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Show Up Rate
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    +{adjustments.showUpRate}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={adjustments.showUpRate}
                  onChange={(e) =>
                    handleAdjustmentChange('showUpRate', Number(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>Current</span>
                  <span>+300%</span>
                </div>
              </div>

              {/* Close Rate Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Close Rate
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    +{adjustments.closeRate}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={adjustments.closeRate}
                  onChange={(e) =>
                    handleAdjustmentChange('closeRate', Number(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>Current</span>
                  <span>+300%</span>
                </div>
              </div>

              {/* AOV Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Avg Deal Value
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    ${projectedAovDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.aov}
                  onChange={(e) =>
                    handleAdjustmentChange('aov', Number(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>${currentAov.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span>${(currentAov * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 text-sm font-bold text-slate-400 bg-slate-800/50 rounded-xl hover:bg-slate-800 hover:text-white transition-all"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Projected Metrics Grid (Right) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Projected Revenue"
              value={projectedMetrics.totalRevenue}
              unit="$"
              subtitle="Total projected cash collected"
              trend="up"
            />
            <MetricCard
              title="Projected Booking Rate"
              value={projectedMetrics.bookingRate}
              unit="%"
              subtitle="Projected booked calls / leads"
              trend="up"
            />
            <MetricCard
              title="Projected Show Up Rate"
              value={projectedMetrics.showUpRate}
              unit="%"
              subtitle="Projected show up rate"
              trend="up"
            />
            <MetricCard
              title="Projected Close Rate"
              value={projectedMetrics.closeRate}
              unit="%"
              subtitle="Projected close rate"
              trend="up"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProjectedMetrics(
  current: DashboardMetrics,
  adjustments: Adjustments,
): DashboardMetrics {
  // 1. Calculate New Booking Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentBookingRate = current.bookingRate || 0;
  const newBookingRate = currentBookingRate * (1 + adjustments.bookingRate / 100);

  // 2. Calculate New Booked Calls based on New Booking Rate
  let newBookedCalls = 0;
  if (current.totalLeads > 0) {
    newBookedCalls = (current.totalLeads * newBookingRate) / 100;
  } else {
    // Fallback if no leads data
    newBookedCalls = current.bookedCalls * (1 + adjustments.bookingRate / 100);
  }

  // 3. Calculate New Show Up Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentShowUpRate = current.showUpRate || 0;
  const newShowUpRate = Math.min(100, currentShowUpRate * (1 + adjustments.showUpRate / 100));

  // 4. Calculate New Show Ups
  const newShowUps = (newBookedCalls * newShowUpRate) / 100;

  // 5. Calculate New Close Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentCloseRate = current.closeRate || 0;
  const newCloseRate = Math.min(100, currentCloseRate * (1 + adjustments.closeRate / 100));

  // 6. Calculate New Won Deals
  const newWonDeals = (newShowUps * newCloseRate) / 100;

  // 7. Calculate New AOV
  const currentAOV = current.averageDealValue || 0;
  const newAOV = currentAOV * (1 + adjustments.aov / 100);

  // 8. Calculate New Total Revenue
  const newTotalRevenue = newWonDeals * newAOV;

  return {
    ...current,
    bookingRate: newBookingRate,
    bookedCalls: Math.round(newBookedCalls),
    showUpRate: newShowUpRate,
    showUps: Math.round(newShowUps),
    closeRate: newCloseRate,
    wonDeals: Math.round(newWonDeals),
    averageDealValue: newAOV,
    totalRevenue: newTotalRevenue,
  };
}

