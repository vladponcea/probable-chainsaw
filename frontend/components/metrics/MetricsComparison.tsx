'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface MetricsComparisonProps {
  metrics: DashboardMetrics;
  avgLeadsPerMonth: number;
}

interface Adjustments {
  leads: number; // percentage change
  bookingRate: number; // percentage change
  showUpRate: number; // percentage change
  closeRate: number; // percentage change
  aov: number; // percentage change
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
    bookingRate: 0,
    showUpRate: 0,
    closeRate: 0,
    aov: 0,
  });

  const [baseMetrics, setBaseMetrics] = useState<BaseMetrics>({
    leads: avgLeadsPerMonth || 0,
    bookingRate: metrics.bookingRate || 0,
    showUpRate: metrics.showUpRate || 0,
    closeRate: metrics.closeRate || 0,
    averageDealValue: metrics.averageDealValue || 0,
  });

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

  const handleAdjustmentChange = (key: keyof Adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  const handleBaseMetricChange = (key: keyof BaseMetrics, value: number) => {
    setBaseMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setAdjustments({
      leads: 0,
      bookingRate: 0,
      showUpRate: 0,
      closeRate: 0,
      aov: 0,
    });
    setBaseMetrics({
      leads: avgLeadsPerMonth || 0,
      bookingRate: metrics.bookingRate || 0,
      showUpRate: metrics.showUpRate || 0,
      closeRate: metrics.closeRate || 0,
      averageDealValue: metrics.averageDealValue || 0,
    });
  };

  // Helper to handle slider change (converts absolute value to percentage adjustment)
  const onSliderChange = (key: keyof Adjustments, newValue: number, baseValue: number) => {
    if (baseValue === 0) return; // Avoid division by zero
    const adjustment = ((newValue - baseValue) / baseValue) * 100;
    handleAdjustmentChange(key, adjustment);
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
            <div className="space-y-12">
              {/* Leads Slider */}
              <SliderControl
                label="Leads / Month"
                value={Math.round(projectedMetrics.totalLeads)}
                min={baseMetrics.leads}
                max={baseMetrics.leads * 3}
                onChange={(val) => onSliderChange('leads', val, baseMetrics.leads)}
                baseValue={baseMetrics.leads}
                onBaseChange={(val) => handleBaseMetricChange('leads', val)}
                baseFormat={(v) => v.toFixed(0)}
              />

              {/* Booking Rate Slider */}
              <SliderControl
                label="Booking Rate"
                value={Number((projectedMetrics.bookingRate || 0).toFixed(1))}
                min={baseMetrics.bookingRate}
                max={100}
                onChange={(val) => onSliderChange('bookingRate', val, baseMetrics.bookingRate)}
                baseValue={baseMetrics.bookingRate}
                onBaseChange={(val) => handleBaseMetricChange('bookingRate', val)}
                baseFormat={(v) => `${v.toFixed(1)}%`}
                valueSuffix="%"
              />

              {/* Show Up Rate Slider */}
              <SliderControl
                label="Show Up Rate"
                value={Number((projectedMetrics.showUpRate || 0).toFixed(1))}
                min={baseMetrics.showUpRate}
                max={100}
                onChange={(val) => onSliderChange('showUpRate', val, baseMetrics.showUpRate)}
                baseValue={baseMetrics.showUpRate}
                onBaseChange={(val) => handleBaseMetricChange('showUpRate', val)}
                baseFormat={(v) => `${v.toFixed(1)}%`}
                valueSuffix="%"
              />

              {/* Close Rate Slider */}
              <SliderControl
                label="Close Rate"
                value={Number((projectedMetrics.closeRate || 0).toFixed(1))}
                min={baseMetrics.closeRate}
                max={100}
                onChange={(val) => onSliderChange('closeRate', val, baseMetrics.closeRate)}
                baseValue={baseMetrics.closeRate}
                onBaseChange={(val) => handleBaseMetricChange('closeRate', val)}
                baseFormat={(v) => `${v.toFixed(1)}%`}
                valueSuffix="%"
              />

              {/* AOV Slider */}
              <SliderControl
                label="Avg Deal Value"
                value={projectedMetrics.averageDealValue || 0}
                min={baseMetrics.averageDealValue}
                max={baseMetrics.averageDealValue * 3}
                onChange={(val) => onSliderChange('aov', val, baseMetrics.averageDealValue)}
                baseValue={baseMetrics.averageDealValue}
                onBaseChange={(val) => handleBaseMetricChange('averageDealValue', val)}
                baseFormat={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                valuePrefix="$"
              />
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
              value={projectedMetrics.totalRevenue}
              unit="$"
              subtitle="Projected monthly cash collected"
              trend="up"
              prefix="+"
            />
            <MetricCard
              title="Projected Monthly Booked Calls"
              value={projectedMetrics.bookedCalls}
              unit=""
              subtitle="Projected booked calls / month"
              trend="up"
              prefix="+"
            />
            <MetricCard
              title="Projected Monthly Show Ups"
              value={projectedMetrics.showUps}
              unit=""
              subtitle="Projected show ups / month"
              trend="up"
              prefix="+"
            />
            <MetricCard
              title="Projected Monthly Won Deals"
              value={projectedMetrics.wonDeals}
              unit=""
              subtitle="Projected won deals / month"
              trend="up"
              prefix="+"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
      setTempValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value.toString());
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

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  baseValue: number;
  onBaseChange: (val: number) => void;
  baseFormat: (v: number) => string;
  valuePrefix?: string;
  valueSuffix?: string;
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
  baseValue,
  onBaseChange,
  baseFormat,
  valuePrefix = '',
  valueSuffix = '',
}: SliderControlProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  // Calculate absolute difference for top-right label
  const difference = value - baseValue;

  // Format difference: show absolute value with + sign, no %
  let formattedDiff = difference > 0 ? `+${Number(difference.toFixed(1))}` : '0';
  if (valuePrefix === '$') {
    formattedDiff = difference > 0 ? `+$${difference.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0';
  }

  const isDot = percent <= 5 || percent >= 95;

  return (
    <div className="relative pt-2 pb-2">
      <div className="flex justify-between items-center mb-6">
        <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
          {label}
        </label>
        <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
          {formattedDiff}
        </div>
      </div>

      <div className="relative h-2 w-full">
        {/* Track Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-slate-800 rounded-lg" />

        {/* Active Track */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-lg"
          style={{ width: `${percent}%` }}
        />

        {/* Custom Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${percent}%` }}
        >
          <div
            className={`
              bg-blue-600 rounded-full shadow-lg flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${isDot ? 'w-4 h-4 p-0' : 'min-w-[3rem] px-3 py-1'}
            `}
          >
            <span
              className={`
                text-white text-xs font-bold whitespace-nowrap overflow-hidden transition-all duration-300
                ${isDot ? 'max-w-0 opacity-0' : 'max-w-[8rem] opacity-100'}
              `}
            >
              {valuePrefix}{value.toLocaleString()}{valueSuffix}
            </span>
          </div>
        </div>

        {/* Invisible Input for Interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={max - min > 100 ? 1 : 0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 mt-4 font-medium">
        <EditableMetricBase
          value={baseValue}
          onChange={onBaseChange}
          format={baseFormat}
        />
        <span>{valuePrefix}{max.toLocaleString(undefined, { maximumFractionDigits: 0 })}{valueSuffix}</span>
      </div>
    </div>
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
    totalLeads: Math.round(newLeads),
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
