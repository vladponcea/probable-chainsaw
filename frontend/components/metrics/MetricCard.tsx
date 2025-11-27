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
    <div className="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/20 hover:border-primary-500/50 hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h3 className="text-sm font-medium text-slate-400 mb-2 tracking-wide uppercase text-xs">{title}</h3>
        <div className="flex items-baseline">
          <p className={`text-3xl font-bold tracking-tight ${trend === 'up' ? 'text-emerald-400' :
              trend === 'down' ? 'text-rose-400' :
                'text-white'
            }`}>
            {formatValue()}
          </p>
          {unit && value !== null && !isLoading && (
            <span className="ml-2 text-lg text-slate-500 font-medium">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="mt-3 text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

