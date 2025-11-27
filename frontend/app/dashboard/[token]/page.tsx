'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi, dashboardApi, Client, DashboardMetrics, SyncStatus, DateRangeOption } from '@/lib/api';
import MetricsGrid from '@/components/metrics/MetricsGrid';
import DateRangePicker from '@/components/metrics/DateRangePicker';
import SyncStatusComponent from '@/components/metrics/SyncStatus';
import MetricsComparison from '@/components/metrics/MetricsComparison';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('mtd');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchClientData();
      fetchSyncStatus();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (
      dateRange === 'custom' &&
      (!customRange.startDate || !customRange.endDate)
    ) {
      setMetrics(null);
      return;
    }
    fetchMetrics();
  }, [token, dateRange, customRange.startDate, customRange.endDate]);

  const fetchClientData = async () => {
    try {
      const clientData = await clientsApi.getByToken(token);
      setClient(clientData);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load dashboard data',
      );
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) return;
      if (
        dateRange === 'custom' &&
        (!customRange.startDate || !customRange.endDate)
      ) {
        return;
      }
      const metricsData = await dashboardApi.getMetrics(token, {
        period: dateRange,
        ...(dateRange === 'custom'
          ? {
            startDate: customRange.startDate,
            endDate: customRange.endDate,
          }
          : {}),
      });
      setMetrics(metricsData);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load metrics',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const status = await dashboardApi.getSyncStatus(token);
      setSyncStatus(status);
    } catch (err: any) {
      // Don't show error for sync status, just log it
      console.error('Failed to fetch sync status:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await dashboardApi.triggerSync(token);
      // Refresh metrics and sync status after sync
      await Promise.all([fetchMetrics(), fetchSyncStatus()]);

      // Show success/partial success message
      if (result.success) {
        // Success message is already shown in sync status
      } else {
        alert(result.message || 'Sync completed with errors');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to sync data';
      alert(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleDateRangeChange = (
    range: DateRangeOption,
    options?: { startDate?: string; endDate?: string },
  ) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomRange({
        startDate: options?.startDate || '',
        endDate: options?.endDate || '',
      });
      if (!options?.startDate || !options?.endDate) {
        setMetrics(null);
      }
    } else {
      setCustomRange({ startDate: '', endDate: '' });
    }
  };


  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 max-w-md w-full">
          <div className="text-rose-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Error Loading Dashboard
          </h2>
          <p className="text-slate-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-slate-400 font-medium">
              <span className="text-primary-400">{client?.companyName || 'Your'}</span> Performance Metrics
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto">
              <DateRangePicker
                selectedRange={dateRange}
                customStartDate={customRange.startDate}
                customEndDate={customRange.endDate}
                onChange={handleDateRangeChange}
              />
            </div>

            <button
              onClick={() => router.push(`/dashboard/${token}/integrations`)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Integrations
            </button>
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="animate-fade-in">
            <SyncStatusComponent
              lastSync={syncStatus.lastSync}
              status={syncStatus.status}
              onSync={handleSync}
              isSyncing={syncing}
            />
          </div>
        )}

        {/* Metrics Grid */}
        {dateRange === 'custom' &&
          (!customRange.startDate || !customRange.endDate) ? (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800 p-12 text-center text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Select a Date Range</p>
            <p className="text-sm mt-2">Please select both a start and end date to view metrics.</p>
          </div>
        ) : metrics ? (
          <div className="animate-slide-up space-y-8">
            <MetricsGrid metrics={metrics} isLoading={loading} />
            <MetricsComparison metrics={metrics} />
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800 p-20 text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-400 font-medium animate-pulse">Loading dashboard metrics...</p>
          </div>
        )}

        {error && metrics && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-rose-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
