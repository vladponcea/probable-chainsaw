'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi, dashboardApi, Client, DashboardMetrics, SyncStatus, SyncProgress, DateRangeOption } from '@/lib/api';
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
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
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
      setSyncProgress(null);
      const result = await dashboardApi.triggerSync(token);
      
      if (!result.success) {
        alert(result.message || 'Failed to start sync');
        setSyncing(false);
        return;
      }

      // Poll for progress updates
      let progressInterval: NodeJS.Timeout | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      progressInterval = setInterval(async () => {
        try {
          const progress = await dashboardApi.getSyncProgress(token);
          setSyncProgress(progress);
          
          if (progress && (progress.status === 'completed' || progress.status === 'error')) {
            if (progressInterval) clearInterval(progressInterval);
            if (timeoutId) clearTimeout(timeoutId);
            setSyncing(false);
            // Refresh metrics and sync status after sync completes
            await Promise.all([fetchMetrics(), fetchSyncStatus()]);
            // Clear progress after 5 seconds
            setTimeout(() => {
              setSyncProgress(null);
              dashboardApi.clearSyncProgress(token);
            }, 5000);
          }
        } catch (err) {
          // Ignore errors while polling
          console.error('Error fetching sync progress:', err);
        }
      }, 1000); // Poll every second

      // Timeout after 5 minutes
      timeoutId = setTimeout(() => {
        if (progressInterval) clearInterval(progressInterval);
        setSyncing(false);
        alert('Sync is taking longer than expected. Please check back later.');
      }, 300000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to sync data';
      alert(errorMsg);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4">
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                {client?.companyName || 'Your'} Performance Metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/dashboard/${token}/integrations`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
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
          <div className="flex justify-end">
            <div className="max-w-xl w-full">
              <DateRangePicker
                selectedRange={dateRange}
                customStartDate={customRange.startDate}
                customEndDate={customRange.endDate}
                onChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="mb-6">
            <SyncStatusComponent
              lastSync={syncStatus.lastSync}
              status={syncStatus.status}
              onSync={handleSync}
              isSyncing={syncing}
              progress={syncProgress}
            />
          </div>
        )}

        {/* Metrics Grid */}
        {dateRange === 'custom' &&
        (!customRange.startDate || !customRange.endDate) ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            Select both a start and end date to view metrics.
          </div>
        ) : metrics ? (
          <>
            <MetricsGrid metrics={metrics} isLoading={loading} />
            <MetricsComparison metrics={metrics} />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading metrics...</p>
          </div>
        )}

        {error && metrics && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
