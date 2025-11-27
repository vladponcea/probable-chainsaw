'use client';

import { useMemo } from 'react';
import { DateRangeOption } from '@/lib/api';

const PRESET_RANGES: { id: DateRangeOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'mtd', label: 'MTD' },
  { id: 'qtd', label: 'QTD' },
  { id: 'ytd', label: 'YTD' },
  { id: 'custom', label: 'Custom' },
];

interface DateRangePickerProps {
  selectedRange: DateRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  onChange: (
    range: DateRangeOption,
    options?: { startDate?: string; endDate?: string },
  ) => void;
}

export default function DateRangePicker({
  selectedRange,
  customStartDate,
  customEndDate,
  onChange,
}: DateRangePickerProps) {
  const isCustom = selectedRange === 'custom';
  const isCustomReady = useMemo(
    () => Boolean(customStartDate && customEndDate),
    [customStartDate, customEndDate],
  );

  const handleRangeClick = (range: DateRangeOption) => {
    onChange(range);
  };

  const handleCustomChange = (key: 'startDate' | 'endDate', value: string) => {
    const nextStart =
      key === 'startDate' ? value : customStartDate || value;
    const nextEnd = key === 'endDate' ? value : customEndDate || value;
    onChange('custom', {
      startDate: nextStart,
      endDate: nextEnd,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 backdrop-blur-sm inline-flex">
        {PRESET_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => handleRangeClick(range.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRange === range.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 ring-1 ring-primary-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl animate-fade-in">
          <div>
            <label
              htmlFor="custom-start-date"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Start Date
            </label>
            <input
              id="custom-start-date"
              type="date"
              value={customStartDate || ''}
              onChange={(e) => handleCustomChange('startDate', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="custom-end-date"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              End Date
            </label>
            <input
              id="custom-end-date"
              type="date"
              value={customEndDate || ''}
              onChange={(e) => handleCustomChange('endDate', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
            />
          </div>
          {!isCustomReady && (
            <p className="text-xs text-amber-400 sm:col-span-2 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select both a start and end date to apply the custom range.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

