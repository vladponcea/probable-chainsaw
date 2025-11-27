'use client';

import { DashboardMetrics } from '@/lib/api';
import MetricCard from './MetricCard';

interface BaselineKPIsProps {
  metrics: DashboardMetrics;
}

interface BaselineTarget {
  key: keyof DashboardMetrics;
  title: string;
  target: string;
  operator: 'less' | 'greater';
  current: number | null;
  unit?: string;
}

export default function BaselineKPIs({ metrics }: BaselineKPIsProps) {
  const baselineTargets: BaselineTarget[] = [
    {
      key: 'speedToLead',
      title: 'Speed to Lead',
      target: '< 2min',
      operator: 'less',
      current: metrics.speedToLead,
      unit: 'min',
    },
    {
      key: 'bookingRate',
      title: 'Booking Rate',
      target: '> 15%',
      operator: 'greater',
      current: metrics.bookingRate,
      unit: '%',
    },
    {
      key: 'cancellationRate',
      title: 'Cancellation Rate',
      target: '< 20%',
      operator: 'less',
      current: metrics.cancellationRate,
      unit: '%',
    },
    {
      key: 'showUpRate',
      title: 'Show Up Rate',
      target: '> 60%',
      operator: 'greater',
      current: metrics.showUpRate,
      unit: '%',
    },
    {
      key: 'closeRate',
      title: 'Close Rate',
      target: '> 35%',
      operator: 'greater',
      current: metrics.closeRate,
      unit: '%',
    },
    {
      key: 'crmHygiene',
      title: 'CRM Hygiene',
      target: '> 80%',
      operator: 'greater',
      current: metrics.crmHygiene,
      unit: '%',
    },
  ];

  const meetsTarget = (target: BaselineTarget): boolean | null => {
    if (target.current === null) return null;

    if (target.operator === 'less') {
      // For speed to lead, convert from hours to minutes
      if (target.key === 'speedToLead') {
        const currentInMinutes = target.current * 60; // Convert hours to minutes
        return currentInMinutes < 2;
      }
      // For cancellation rate
      return target.current < 20;
    } else {
      // For greater than operators
      if (target.key === 'bookingRate') {
        return target.current > 15;
      }
      if (target.key === 'showUpRate') {
        return target.current > 60;
      }
      if (target.key === 'closeRate') {
        return target.current > 35;
      }
      if (target.key === 'crmHygiene') {
        return target.current > 80;
      }
    }
    return null;
  };

  const formatValue = (target: BaselineTarget): string => {
    if (target.current === null) return 'N/A';

    if (target.key === 'speedToLead') {
      // Convert from hours to minutes
      const minutes = target.current * 60;
      return minutes.toFixed(1);
    }

    return target.current.toFixed(1);
  };

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
          Baseline KPIs
        </h2>
        <p className="text-slate-400 font-medium">
          Target metrics your business should achieve
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {baselineTargets.map((target) => {
          const meets = meetsTarget(target);
          const value = formatValue(target);
          const isGood = meets === true;
          const isBad = meets === false;
          const isUnknown = meets === null;

          return (
            <div
              key={target.key}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-lg shadow-black/20 relative overflow-hidden"
            >
              {/* Status indicator bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isGood
                    ? 'bg-emerald-500'
                    : isBad
                      ? 'bg-rose-500'
                      : 'bg-slate-600'
                }`}
              />

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {target.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-extrabold ${
                        isGood
                          ? 'text-emerald-400'
                          : isBad
                            ? 'text-rose-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {value}
                    </span>
                    {target.unit && value !== 'N/A' && (
                      <span className="text-lg text-slate-500">{target.unit}</span>
                    )}
                  </div>
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isGood ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : isBad ? (
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-rose-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-600/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Target indicator */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Target:
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isGood
                        ? 'text-emerald-400'
                        : isBad
                          ? 'text-rose-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {target.target}
                  </span>
                </div>
                {isGood && (
                  <p className="text-xs text-emerald-400 mt-2 font-medium">
                    ✓ Meeting target
                  </p>
                )}
                {isBad && (
                  <p className="text-xs text-rose-400 mt-2 font-medium">
                    ✗ Below target
                  </p>
                )}
                {isUnknown && (
                  <p className="text-xs text-slate-500 mt-2">
                    No data available
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

