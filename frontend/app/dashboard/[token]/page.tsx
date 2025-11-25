'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { clientsApi, dashboardApi, Client, DashboardMetrics, SyncStatus } from '@/lib/api';
import MetricsGrid from '@/components/metrics/MetricsGrid';
import TimePeriodToggle from '@/components/metrics/TimePeriodToggle';
import SyncStatusComponent from '@/components/metrics/SyncStatus';
import IntegrationCard from '@/components/integrations/IntegrationCard';

export default function DashboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [period, setPeriod] = useState<'all' | '30d'>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchClientData();
      fetchMetrics();
      fetchSyncStatus();
    }
  }, [token, period]);

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
      const metricsData = await dashboardApi.getMetrics(token, period);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                {client?.companyName || 'Your'} Performance Metrics
              </p>
            </div>
            <TimePeriodToggle period={period} onChange={setPeriod} />
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
            />
          </div>
        )}

        {/* Metrics Grid */}
        {metrics ? (
          <MetricsGrid metrics={metrics} isLoading={loading} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading metrics...</p>
          </div>
        )}

        {/* Integration Management */}
        {client && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Integration Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <IntegrationCard
                name="Calendly"
                connected={client.calendlyConnected}
                description="Manage your calendar bookings"
                onUpdate={async (apiKey: string) => {
                  await dashboardApi.updateCalendly(token, { apiKey });
                  await fetchClientData();
                }}
              />
              <IntegrationCard
                name="Close CRM"
                connected={client.closeConnected}
                description="Sync leads and deals"
                onUpdate={async (apiKey: string) => {
                  await dashboardApi.updateClose(token, { apiKey });
                  await fetchClientData();
                }}
              />
              <IntegrationCard
                name="Stripe"
                connected={client.stripeConnected}
                description="Track payments and revenue"
                onUpdate={async (apiKey: string) => {
                  await dashboardApi.updateStripe(token, { apiKey });
                  await fetchClientData();
                }}
              />
            </div>
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
