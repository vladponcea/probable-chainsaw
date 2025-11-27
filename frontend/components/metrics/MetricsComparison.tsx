'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface MetricsComparisonProps {
  metrics: DashboardMetrics;
  avgLeadsPerMonth: number;
}

interface Adjustments {
  leads: number; // percentage change (0 to 300)
  bookingRate: number; // percentage change (0 to 300)
  showUpRate: number; // percentage change (0 to 300)
  closeRate: number; // percentage change (0 to 300)
  aov: number; // percentage change (0 to 200)
}

interface BaseMetrics {
  leads: number;
  bookingRate: number;
  showUpRate: number;
  closeRate: number;
  averageDealValue: number;
}

export default function MetricsComparison({ metrics, avgLeadsPerMonth }: MetricsComparisonProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({
    leads: 0,
    bookingRate: 25,
    showUpRate: 25,
    closeRate: 0,
    aov: 0,
  });

  // Local state for base metrics to allow manual overrides (e.g. when value is 0)
  const [baseMetrics, setBaseMetrics] = useState<BaseMetrics>({
    leads: avgLeadsPerMonth || 0,
    bookingRate: metrics.bookingRate || 0,
    showUpRate: metrics.showUpRate || 0,
    closeRate: metrics.closeRate || 0,
    averageDealValue: metrics.averageDealValue || 0,
  });

  // Sync state with props when props change
  useEffect(() => {
    setBaseMetrics({
      leads: avgLeadsPerMonth || 0,
      bookingRate: metrics.bookingRate || 0,
      showUpRate: metrics.showUpRate || 0,
      closeRate: metrics.closeRate || 0,
      averageDealValue: metrics.averageDealValue || 0,
    });
  }, [
    avgLeadsPerMonth,
    metrics.bookingRate,
    metrics.showUpRate,
    metrics.closeRate,
    metrics.averageDealValue,
  ]);

  const projectedMetrics = useMemo(() => {
    return calculateProjectedMetrics(metrics, adjustments, baseMetrics);
  }, [metrics, adjustments, baseMetrics]);

  const baseProjectedMetrics = useMemo(() => {
    return calculateProjectedMetrics(metrics, {
      leads: 0,
      bookingRate: 0,
      showUpRate: 0,
      closeRate: 0,
      aov: 0,
    }, baseMetrics);
  }, [metrics, baseMetrics]);

  const calculateGrowth = (current: number, projected: number) => {
    if (current === 0) return projected > 0 ? 100 : 0;
    return ((projected - current) / current) * 100;
  };

  const formatGrowth = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(0)}%`;
  };

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
      leads: 0,
      bookingRate: 25,
      showUpRate: 25,
      closeRate: 0,
      aov: 0,
    });
    // Also reset base metrics to props
    setBaseMetrics({
      leads: avgLeadsPerMonth || 0,
      bookingRate: metrics.bookingRate || 0,
      showUpRate: metrics.showUpRate || 0,
      closeRate: metrics.closeRate || 0,
      averageDealValue: metrics.averageDealValue || 0,
    });
  };

  return (
    <div className="mt-12 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
          Projected Monthly Growth
        </h2>
        <p className="text-slate-400 text-lg">
          Adjust key metrics to forecast your potential monthly revenue. Double-click on current values to edit them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Section (Left) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/20">
            <div className="space-y-8">
              {/* Leads Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Leads / Month
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    {Math.round(projectedMetrics.totalLeads)} / +{adjustments.leads}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={adjustments.leads}
                  onChange={(e) =>
                    handleAdjustmentChange('leads', Number(e.target.value))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <EditableMetricBase
                    value={baseMetrics.leads}
                    onChange={(val) => handleBaseMetricChange('leads', val)}
                    format={(v) => v.toFixed(0)}
                  />
                  <span>+300%</span>
                </div>
              </div>

              {/* Booking Rate Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Booking Rate
                  </label>
                  <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    {(projectedMetrics.bookingRate || 0).toFixed(1)}% / +{adjustments.bookingRate}%
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
                    {(projectedMetrics.showUpRate || 0).toFixed(1)}% / +{adjustments.showUpRate}%
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
                    {(projectedMetrics.closeRate || 0).toFixed(1)}% / +{adjustments.closeRate}%
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
                    ${(projectedMetrics.averageDealValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} / +{adjustments.aov}%
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
                  <span>${(baseMetrics.averageDealValue * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
              title="Projected Monthly Revenue"
              value={`$${projectedMetrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${formatGrowth(calculateGrowth(baseProjectedMetrics.totalRevenue, projectedMetrics.totalRevenue))}`}
              unit=""
              subtitle="Projected monthly cash collected"
              trend="up"
            />
            <MetricCard
              title="Projected Monthly Booked Calls"
              value={`${projectedMetrics.bookedCalls} / ${formatGrowth(calculateGrowth(baseProjectedMetrics.bookedCalls, projectedMetrics.bookedCalls))}`}
              unit=""
              subtitle="Projected booked calls / month"
              trend="up"
            />
            <MetricCard
              title="Projected Monthly Show Ups"
              value={`${projectedMetrics.showUps} / ${formatGrowth(calculateGrowth(baseProjectedMetrics.showUps, projectedMetrics.showUps))}`}
              unit=""
              subtitle="Projected show ups / month"
              trend="up"
            />
            <MetricCard
              title="Projected Monthly Won Deals"
              value={`${projectedMetrics.wonDeals} / ${formatGrowth(calculateGrowth(baseProjectedMetrics.wonDeals, projectedMetrics.wonDeals))}`}
              unit=""
              subtitle="Projected won deals / month"
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
  // 1. Calculate New Monthly Leads
  const currentLeads = base.leads;
  const newLeads = currentLeads * (1 + adjustments.leads / 100);

  // 2. Calculate New Booking Rate
  const currentBookingRate = base.bookingRate;
  const newBookingRate = currentBookingRate * (1 + adjustments.bookingRate / 100);

  // 3. Calculate New Booked Calls based on New Leads and Rate
  const newBookedCalls = (newLeads * newBookingRate) / 100;

  // 4. Calculate New Show Up Rate
  const currentShowUpRate = base.showUpRate;
  const newShowUpRate = Math.min(100, currentShowUpRate * (1 + adjustments.showUpRate / 100));

  // 5. Calculate New Show Ups
  const newShowUps = (newBookedCalls * newShowUpRate) / 100;

  // 6. Calculate New Close Rate
  const currentCloseRate = base.closeRate;
  const newCloseRate = Math.min(100, currentCloseRate * (1 + adjustments.closeRate / 100));

  // 7. Calculate New Won Deals
  const newWonDeals = (newShowUps * newCloseRate) / 100;

  // 8. Calculate New AOV
  const currentAOV = base.averageDealValue;
  const newAOV = currentAOV * (1 + adjustments.aov / 100);

  // 9. Calculate New Total Revenue
  const newTotalRevenue = newWonDeals * newAOV;

  return {
    ...current,
    totalLeads: Math.round(newLeads), // Repurposing totalLeads as Monthly Leads for display
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

