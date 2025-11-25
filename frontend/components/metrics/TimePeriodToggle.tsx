'use client';

interface TimePeriodToggleProps {
  period: 'all' | '30d';
  onChange: (period: 'all' | '30d') => void;
}

export default function TimePeriodToggle({
  period,
  onChange,
}: TimePeriodToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
      <button
        onClick={() => onChange('all')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          period === 'all'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Time
      </button>
      <button
        onClick={() => onChange('30d')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          period === '30d'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Last 30 Days
      </button>
    </div>
  );
}

