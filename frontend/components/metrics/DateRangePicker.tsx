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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESET_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => handleRangeClick(range.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedRange === range.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <div>
            <label
              htmlFor="custom-start-date"
              className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2"
            >
              Start Date
            </label>
            <input
              id="custom-start-date"
              type="date"
              value={customStartDate || ''}
              onChange={(e) => handleCustomChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="custom-end-date"
              className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2"
            >
              End Date
            </label>
            <input
              id="custom-end-date"
              type="date"
              value={customEndDate || ''}
              onChange={(e) => handleCustomChange('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {!isCustomReady && (
            <p className="text-xs text-gray-500 sm:col-span-2">
              Select both a start and end date to apply the custom range.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

