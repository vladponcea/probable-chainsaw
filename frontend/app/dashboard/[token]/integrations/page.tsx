'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi, dashboardApi, Client } from '@/lib/api';
import IntegrationCard from '@/components/integrations/IntegrationCard';

export default function IntegrationsPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchClientData();
    }
  }, [token]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await clientsApi.getByToken(token);
      setClient(clientData);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load integrations',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

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
                Integration Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your connected integrations and API keys
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/${token}`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Integration Cards */}
        {client && (
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
        )}

        {error && client && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

