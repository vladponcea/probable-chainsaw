'use client';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  isLoading,
}: MetricCardProps) {
  const formatValue = () => {
    if (isLoading) return '...';
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (unit === '%') {
        return `${value.toFixed(1)}%`;
      }
      if (unit === '$') {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (unit === 'hours') {
        return `${value.toFixed(1)}h`;
      }
      if (unit === 'days') {
        return `${value.toFixed(1)}d`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <p className={`text-3xl font-bold ${getTrendColor()}`}>
          {formatValue()}
        </p>
        {unit && value !== null && !isLoading && (
          <span className="ml-2 text-lg text-gray-500">{unit}</span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}

