'use client';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  target?: string;
  targetStatus?: 'met' | 'below' | null;
  isLoading?: boolean;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  target,
  targetStatus,
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

      {/* Status Indicator Bar */}
      {targetStatus && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${targetStatus === 'met'
              ? 'bg-emerald-500'
              : targetStatus === 'below'
                ? 'bg-rose-500'
                : 'bg-slate-600'
            }`}
        />
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-slate-400 tracking-wide uppercase text-xs">{title}</h3>

          {/* Status Icon */}
          {targetStatus && (
            <div className="flex-shrink-0 ml-2">
              {targetStatus === 'met' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : targetStatus === 'below' ? (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-baseline">
          <p className={`text-3xl font-bold tracking-tight ${targetStatus === 'met' ? 'text-emerald-400' :
              targetStatus === 'below' ? 'text-rose-400' :
                trend === 'up' ? 'text-emerald-400' :
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

        {/* Target Section */}
        {target && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Target:</span>
              <span className={`text-xs font-bold ${targetStatus === 'met' ? 'text-emerald-400' :
                  targetStatus === 'below' ? 'text-rose-400' :
                    'text-slate-400'
                }`}>
                {target}
              </span>
            </div>
            {targetStatus === 'met' && (
              <p className="text-xs text-emerald-400 mt-1 font-medium">✓ Meeting target</p>
            )}
            {targetStatus === 'below' && (
              <p className="text-xs text-rose-400 mt-1 font-medium">✗ Below target</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

