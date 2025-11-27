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

interface BaseMetrics {
  bookingRate: number;
  showUpRate: number;
  closeRate: number;
  averageDealValue: number;
}

export default function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({
    bookingRate: 25,
    showUpRate: 25,
    closeRate: 0,
    aov: 0,
  });

  // Local state for base metrics to allow manual overrides (e.g. when value is 0)
  const [baseMetrics, setBaseMetrics] = useState<BaseMetrics>({
    bookingRate: metrics.bookingRate || 0,
    showUpRate: metrics.showUpRate || 0,
    closeRate: metrics.closeRate || 0,
    averageDealValue: metrics.averageDealValue || 0,
  });

  // Sync state with props when props change, but only if we haven't manually edited?
  // For simplicity, we'll sync whenever the prop values actually change.
  useEffect(() => {
    setBaseMetrics({
      bookingRate: metrics.bookingRate || 0,
      showUpRate: metrics.showUpRate || 0,
      closeRate: metrics.closeRate || 0,
      averageDealValue: metrics.averageDealValue || 0,
    });
  }, [
    metrics.bookingRate,
    metrics.showUpRate,
    metrics.closeRate,
    metrics.averageDealValue,
  ]);

  const projectedMetrics = useMemo(() => {
    return calculateProjectedMetrics(metrics, adjustments, baseMetrics);
  }, [metrics, adjustments, baseMetrics]);

  const handleAdjustmentChange = (
    key: keyof Adjustments,
    value: number,
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleBaseMetricChange = (key: keyof BaseMetrics, value: number) => {
    setBaseMetrics((prev) => ({
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
    // Also reset base metrics to props
    setBaseMetrics({
      bookingRate: metrics.bookingRate || 0,
      showUpRate: metrics.showUpRate || 0,
      closeRate: metrics.closeRate || 0,
      averageDealValue: metrics.averageDealValue || 0,
    });
  };

  // Helper to calculate the projected dollar value for AOV slider display
  const currentAov = baseMetrics.averageDealValue;
  const projectedAovDisplay = currentAov * (1 + adjustments.aov / 100);

  return (
    <div className="mt-12 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
          Projected Growth
        </h2>
        <p className="text-slate-400 text-lg">
          Adjust key metrics to forecast your potential revenue. Double-click on current values to edit them.
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
                  <EditableMetricBase
                    value={baseMetrics.bookingRate}
                    onChange={(val) => handleBaseMetricChange('bookingRate', val)}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
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
                  <EditableMetricBase
                    value={baseMetrics.showUpRate}
                    onChange={(val) => handleBaseMetricChange('showUpRate', val)}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
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
                  <EditableMetricBase
                    value={baseMetrics.closeRate}
                    onChange={(val) => handleBaseMetricChange('closeRate', val)}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
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
                  <EditableMetricBase
                    value={baseMetrics.averageDealValue}
                    onChange={(val) => handleBaseMetricChange('averageDealValue', val)}
                    format={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
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

// Helper component for editable base metrics
function EditableMetricBase({
  value,
  onChange,
  format,
}: {
  value: number;
  onChange: (val: number) => void;
  format: (v: number) => string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempValue(value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseFloat(tempValue);
    if (!isNaN(num)) {
      onChange(num);
    } else {
      setTempValue(value.toString()); // Revert if invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value.toString()); // Revert
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 bg-slate-800 text-white text-xs rounded px-2 py-1 border border-primary-500 outline-none"
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className="cursor-pointer hover:text-primary-400 hover:underline transition-all"
      title="Double click to edit base value"
    >
      {format(value)}
    </span>
  );
}

function calculateProjectedMetrics(
  current: DashboardMetrics,
  adjustments: Adjustments,
  base: BaseMetrics,
): DashboardMetrics {
  // 1. Calculate New Booking Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentBookingRate = base.bookingRate;
  const newBookingRate = currentBookingRate * (1 + adjustments.bookingRate / 100);

  // 2. Calculate New Booked Calls based on New Booking Rate
  let newBookedCalls = 0;
  if (current.totalLeads > 0) {
    newBookedCalls = (current.totalLeads * newBookingRate) / 100;
  } else {
    // Fallback if no leads data, assume proportional increase from base booked calls?
    // But we don't have a "base booked calls" in BaseMetrics.
    // We can estimate base booked calls from base booking rate if we assume total leads is constant?
    // Or just use the original bookedCalls and scale it by the ratio of newRate / oldRate?
    // If oldRate is 0, this fails.
    // Let's stick to the logic: newBookedCalls = current.bookedCalls * (1 + adjustments.bookingRate / 100)
    // BUT, if we changed the base rate manually, we should probably use that.
    // If we manually set base rate to 10% (from 0%), and we have 0 leads, we still get 0 calls.
    // This implies we need leads for this to work.
    // If totalLeads is 0, we can't really project anything unless we also override leads.
    // For now, let's assume totalLeads exists or use the fallback.
    newBookedCalls = current.bookedCalls * (1 + adjustments.bookingRate / 100);
  }

  // 3. Calculate New Show Up Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentShowUpRate = base.showUpRate;
  const newShowUpRate = Math.min(100, currentShowUpRate * (1 + adjustments.showUpRate / 100));

  // 4. Calculate New Show Ups
  const newShowUps = (newBookedCalls * newShowUpRate) / 100;

  // 5. Calculate New Close Rate
  // Adjustment is percentage increase (e.g. +50% means current * 1.5)
  const currentCloseRate = base.closeRate;
  const newCloseRate = Math.min(100, currentCloseRate * (1 + adjustments.closeRate / 100));

  // 6. Calculate New Won Deals
  const newWonDeals = (newShowUps * newCloseRate) / 100;

  // 7. Calculate New AOV
  const currentAOV = base.averageDealValue;
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

