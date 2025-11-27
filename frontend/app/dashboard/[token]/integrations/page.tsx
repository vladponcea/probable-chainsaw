'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi, dashboardApi, Client, integrationsApi } from '@/lib/api';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import StatusMappingEditor from '@/components/integrations/StatusMappingEditor';

export default function IntegrationsPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingCrm, setSwitchingCrm] = useState(false);

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

  const handleCrmSwitch = async (crm: 'close' | 'ghl') => {
    if (!confirm(`Are you sure you want to switch to ${crm === 'close' ? 'Close CRM' : 'GoHighLevel'}? This will update your primary CRM connection.`)) {
      return;
    }

    // In a real implementation, we might want to disconnect the other CRM or just focus on the new one.
    // For now, we'll just scroll to the card or highlight it.
    // Since the backend handles them separately, we can just let the user connect the one they want.
    // But to make it "switch", we could potentially clear the other one's key if needed, or just UI focus.

    // Actually, the prompt implies we should allow changing.
    // Let's just render both cards and let the user connect/disconnect as needed, 
    // but maybe style the "active" one differently or show a selector.

    // Given the onboarding flow had a choice, let's replicate that "choice" UI here 
    // to allow them to toggle which one they are actively using/configuring.
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full">
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
            Error
          </h2>
          <p className="text-slate-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Integration Settings
            </h1>
            <p className="mt-2 text-lg text-slate-400 font-medium">
              Manage your connected tools and API keys
            </p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/${token}`)}
            className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center shadow-lg shadow-black/20"
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

        {/* Integration Cards */}
        {client && (
          <div className="grid gap-8">
            {/* CRM Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">CRM Connection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Close CRM Card */}
                <div className={`relative group ${client.closeConnected ? 'order-first' : ''}`}>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div className="relative h-full">
                    <IntegrationCard
                      name="Close CRM"
                      connected={client.closeConnected}
                      description="Sync leads and deals from Close"
                      onUpdate={async (apiKey: string) => {
                        await dashboardApi.updateClose(token, { apiKey });
                        await fetchClientData();
                      }}
                      customizationContent={
                        client.closeConnected ? (
                          <StatusMappingEditor token={token} />
                        ) : undefined
                      }
                    />
                  </div>
                </div>

                {/* GHL Card */}
                <div className={`relative group ${client.ghlConnected ? 'order-first' : ''}`}>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div className="relative h-full">
                    <IntegrationCard
                      name="GoHighLevel"
                      connected={client.ghlConnected}
                      description="Sync contacts and opportunities from GHL"
                      onUpdate={async (apiKey: string) => {
                        await integrationsApi.connectGhl(token, { apiKey });
                        await fetchClientData();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Integrations */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Other Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div className="relative h-full">
                    <IntegrationCard
                      name="Calendly"
                      connected={client.calendlyConnected}
                      description="Manage your calendar bookings"
                      onUpdate={async (apiKey: string) => {
                        await dashboardApi.updateCalendly(token, { apiKey });
                        await fetchClientData();
                      }}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div className="relative h-full">
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
              </div>
            </div>
          </div>
        )}

        {error && client && (
          <div className="mt-8 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

