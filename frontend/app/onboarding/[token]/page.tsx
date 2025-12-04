'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stepper from '@/components/Stepper';
import { clientsApi, integrationsApi, Client } from '@/lib/api';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Integration states
  const [calendlyApiKey, setCalendlyApiKey] = useState('');
  const [closeApiKey, setCloseApiKey] = useState('');
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [calendlyLoading, setCalendlyLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [calendlyError, setCalendlyError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [calendlySuccess, setCalendlySuccess] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [ghlSuccess, setGhlSuccess] = useState(false);
  const [stripeSuccess, setStripeSuccess] = useState(false);

  // CRM Selection
  const [selectedCrm, setSelectedCrm] = useState<'close' | 'ghl'>('close');
  const [ghlApiKey, setGhlApiKey] = useState('');
  const [ghlLoading, setGhlLoading] = useState(false);
  const [ghlError, setGhlError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchClientData();
    }
  }, [token]);

  // Redirect to dashboard when all integrations are connected
  useEffect(() => {
    if (
      client &&
      client.calendlyConnected &&
      client.closeConnected &&
      client.stripeConnected
    ) {
      // Small delay to show success message briefly before redirecting
      const timer = setTimeout(() => {
        router.push(`/dashboard/${token}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [client, token, router]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await clientsApi.getByToken(token);
      setClient(clientData);

      // Set step based on what's already connected
      if (clientData.stripeConnected) {
        setCurrentStep(4);
        setCalendlySuccess(true);
        setCalendlySuccess(true);
        setCloseSuccess(true);
        setGhlSuccess(true);
        setStripeSuccess(true);
      } else if (clientData.closeConnected) {
        setCurrentStep(4);
        setCalendlySuccess(true);
        setCloseSuccess(true);
        setSelectedCrm('close');
      } else if (clientData.ghlConnected) {
        setCurrentStep(4);
        setCalendlySuccess(true);
        setGhlSuccess(true);
        setSelectedCrm('ghl');
      } else if (clientData.calendlyConnected) {
        setCurrentStep(3);
        setCalendlySuccess(true);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load onboarding data',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCalendlyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendlyApiKey.trim()) {
      setCalendlyError('Please enter a Calendly API key');
      return;
    }

    try {
      setCalendlyLoading(true);
      setCalendlyError(null);
      await integrationsApi.connectCalendly(token, { apiKey: calendlyApiKey });
      setCalendlySuccess(true);
      setCalendlyApiKey('');
      // Refresh client data to get updated flags
      await fetchClientData();
    } catch (err: any) {
      setCalendlyError(
        err.response?.data?.message || 'Failed to connect Calendly',
      );
    } finally {
      setCalendlyLoading(false);
    }
  };

  const handleCloseConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeApiKey.trim()) {
      setCloseError('Please enter a Close API key');
      return;
    }

    try {
      setCloseLoading(true);
      setCloseError(null);
      await integrationsApi.connectClose(token, { apiKey: closeApiKey });
      setCloseSuccess(true);
      setCloseApiKey('');
      // Refresh client data to get updated flags
      await fetchClientData();
    } catch (err: any) {
      setCloseError(
        err.response?.data?.message || 'Failed to connect Close CRM',
      );
    } finally {
      setCloseLoading(false);
    }
  };

  const handleGhlConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghlApiKey.trim()) {
      setGhlError('Please enter a GoHighLevel API key');
      return;
    }

    try {
      setGhlLoading(true);
      setGhlError(null);
      await integrationsApi.connectGhl(token, { apiKey: ghlApiKey });
      setGhlSuccess(true);
      setGhlApiKey('');
      // Refresh client data to get updated flags
      await fetchClientData();
    } catch (err: any) {
      setGhlError(
        err.response?.data?.message || 'Failed to connect GoHighLevel',
      );
    } finally {
      setGhlLoading(false);
    }
  };

  const handleStripeConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeApiKey.trim()) {
      setStripeError('Please enter a Stripe API key');
      return;
    }

    try {
      setStripeLoading(true);
      setStripeError(null);
      await integrationsApi.connectStripe(token, { apiKey: stripeApiKey });
      setStripeSuccess(true);
      setStripeApiKey('');
      // Refresh client data to get updated flags
      await fetchClientData();
    } catch (err: any) {
      setStripeError(
        err.response?.data?.message || 'Failed to connect Stripe',
      );
    } finally {
      setStripeLoading(false);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation if step is accessible
    if (step === 1) {
      setCurrentStep(1);
    } else if (step === 2 && (currentStep >= 2 || client?.calendlyConnected)) {
      setCurrentStep(2);
    } else if (
      step === 3 &&
      (currentStep >= 3 ||
        (client?.calendlyConnected && (client?.closeConnected || client?.ghlConnected)))
    ) {
      setCurrentStep(3);
    } else if (
      step === 4 &&
      (currentStep >= 4 ||
        (client?.calendlyConnected && (client?.closeConnected || client?.ghlConnected) && client?.stripeConnected))
    ) {
      setCurrentStep(4);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full animate-fade-in">
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
          <p className="text-sm text-slate-500 mt-4 text-center">
            The onboarding token may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 p-8 md:p-12 animate-slide-up">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-12 text-center">
            Connect Your Tools
          </h1>

          <Stepper
            currentStep={currentStep}
            calendlyConnected={client?.calendlyConnected || false}
            closeConnected={client?.closeConnected || client?.ghlConnected || false}
            stripeConnected={client?.stripeConnected || false}
            onStepClick={handleStepClick}
          />

          <div className="mt-12">
            {/* Step 1: Introduction */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">
                    Connect your tools to generate your free ops dashboard
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    Welcome! You're here to connect your essential business
                    tools so we can generate a comprehensive operations dashboard
                    for you. This dashboard will show you key performance
                    indicators (KPIs) and help you identify opportunities where
                    you might be leaving money on the table.
                  </p>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    By connecting Calendly, Close CRM, and Stripe, we'll analyze your
                    sales pipeline, call metrics, lead conversion rates, payment data,
                    and more to give you actionable insights.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-1"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Calendly Integration */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Step 2 – Connect Calendly
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Connect your Calendly account to track booked calls,
                    cancellations, and show-up rates. This data helps us
                    calculate important metrics like call completion rates and
                    identify patterns in your scheduling.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-400 mr-4 mt-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-100 mb-3">
                        API Token Security & Data Access
                      </h3>
                      <p className="text-blue-200 mb-4 leading-relaxed">
                        <strong>Note:</strong> Calendly does not support restricted API tokens with limited permissions. Personal Access Tokens (PATs) grant access based on your user role. However, we want you to know exactly how we use your token.
                      </p>
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 mb-4">
                        <p className="text-sm font-bold text-blue-100 mb-2">
                          We only <strong>READ</strong> the following data:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-200 space-y-1">
                          <li><strong>Scheduled Events</strong> - Read your scheduled meetings and their status</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-blue-300">
                          <strong>Important:</strong> We <strong>never</strong> create, modify, or delete any data in your Calendly account. We can only read scheduled events to calculate your booking and cancellation metrics.
                        </p>
                        <p className="text-sm text-blue-300">
                          <strong>Security Best Practice:</strong> We recommend creating a dedicated Personal Access Token specifically for this integration. You can monitor its usage and revoke it anytime in Calendly Settings → Integrations → API & Webhooks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
                  <div className="px-6 pt-6">
                    <h3 className="text-lg font-bold text-white">
                      Calendly Scheduling Walkthrough
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 mb-4">
                      Watch this quick Loom to see how to review your event types and scheduling setup inside Calendly.
                    </p>
                  </div>
                  <div
                    className="w-full"
                    dangerouslySetInnerHTML={{
                      __html:
                        '<div class="lo-emb-vid" style="position: relative; padding-bottom: 74.96025437201908%; height: 0;"><iframe src="https://www.loom.com/embed/dbddeb291b274ff1b9616d20a34a9cc6" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>',
                    }}
                  />
                </div>

                {calendlySuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 animate-fade-in">
                    <div className="flex items-center">
                      <svg
                        className="w-6 h-6 text-emerald-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-emerald-200 font-bold">
                        Calendly connected successfully!
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCalendlyConnect} className="space-y-6">
                    <div>
                      <label
                        htmlFor="calendly-key"
                        className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide"
                      >
                        Calendly API key
                      </label>
                      <input
                        id="calendly-key"
                        type="password"
                        value={calendlyApiKey}
                        onChange={(e) => setCalendlyApiKey(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-600 transition-all"
                        placeholder="Enter your Calendly API key"
                      />
                      {calendlyError && (
                        <p className="mt-2 text-sm text-rose-400 font-medium animate-pulse">
                          {calendlyError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={calendlyLoading}
                      className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                    >
                      {calendlyLoading ? 'Connecting...' : 'Connect Calendly'}
                    </button>
                  </form>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all"
                  >
                    Back
                  </button>
                  {calendlySuccess && (
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-1"
                    >
                      Continue to CRM
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: CRM Integration */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Step 3 – Connect CRM
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-8">
                    Connect your CRM to sync leads, pipeline data, and
                    CRM hygiene metrics. This enables us to track your sales
                    funnel, conversion rates, and identify opportunities for
                    improvement.
                  </p>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
                      Choose your CRM
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCrm}
                        onChange={(e) => setSelectedCrm(e.target.value as 'close' | 'ghl')}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white appearance-none cursor-pointer transition-all"
                        disabled={closeSuccess || ghlSuccess}
                      >
                        <option value="close">Close CRM</option>
                        <option value="ghl">GoHighLevel</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCrm === 'close' ? (
                  <>
                    {/* Security Notice for Close */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                      <div className="flex items-start">
                        <svg
                          className="w-6 h-6 text-blue-400 mr-4 mt-1 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-100 mb-3">
                            API Key Security & Data Access
                          </h3>
                          <p className="text-blue-200 mb-4 leading-relaxed">
                            <strong>Note:</strong> Close CRM does not support restricted API keys with limited permissions. All API keys provide full account access. However, we want you to know exactly how we use your API key.
                          </p>
                          <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 mb-4">
                            <p className="text-sm font-bold text-blue-100 mb-2">
                              We only <strong>READ</strong> the following data:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-200 space-y-1">
                              <li><strong>Leads</strong> - Read lead information and status</li>
                              <li><strong>Opportunities (Deals)</strong> - Read deal values, stages, and status</li>
                              <li><strong>Activities</strong> - Read calls, emails, and SMS to calculate first contact dates</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-blue-300">
                              <strong>Important:</strong> We <strong>never</strong> create, modify, or delete any data in your Close CRM account. We can only read the data needed to calculate your metrics.
                            </p>
                            <p className="text-sm text-blue-300">
                              <strong>Security Best Practice:</strong> We recommend creating a dedicated API key specifically for this integration. You can monitor its usage and revoke it anytime in Close CRM Settings → Developer → API Keys.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
                      <div className="px-6 pt-6">
                        <h3 className="text-lg font-bold text-white">
                          Close CRM API Key Walkthrough
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 mb-4">
                          Watch this Loom to see exactly where to find your Close CRM API key.
                        </p>
                      </div>
                      <div
                        className="w-full"
                        dangerouslySetInnerHTML={{
                          __html:
                            '<div class="lo-emb-vid" style="position: relative; padding-bottom: 74.96025437201908%; height: 0;"><iframe src="https://www.loom.com/embed/ddddc95b67af403da31aba438129ba21" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>',
                        }}
                      />
                    </div>

                    {closeSuccess ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 animate-fade-in">
                        <div className="flex items-center">
                          <svg
                            className="w-6 h-6 text-emerald-400 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-emerald-200 font-bold">
                            Close CRM connected successfully!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCloseConnect} className="space-y-6">
                        <div>
                          <label
                            htmlFor="close-key"
                            className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide"
                          >
                            Close CRM API key
                          </label>
                          <input
                            id="close-key"
                            type="password"
                            value={closeApiKey}
                            onChange={(e) => setCloseApiKey(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-600 transition-all"
                            placeholder="Enter your Close CRM API key"
                          />
                          {closeError && (
                            <p className="mt-2 text-sm text-rose-400 font-medium animate-pulse">
                              {closeError}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={closeLoading}
                          className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                        >
                          {closeLoading ? 'Connecting...' : 'Connect Close CRM'}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    {/* Security Notice for GHL */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                      <div className="flex items-start">
                        <svg
                          className="w-6 h-6 text-blue-400 mr-4 mt-1 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-100 mb-3">
                            API Key Security & Data Access
                          </h3>
                          <p className="text-blue-200 mb-4 leading-relaxed">
                            <strong>Note:</strong> We use your GoHighLevel API Key (V2) to access your account data.
                          </p>
                          <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 mb-4">
                            <p className="text-sm font-bold text-blue-100 mb-2">
                              We only <strong>READ</strong> the following data:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-200 space-y-1">
                              <li><strong>Contacts</strong> - Read contact information</li>
                              <li><strong>Opportunities</strong> - Read opportunity values, stages, and status</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
                      <div className="px-6 pt-6">
                        <h3 className="text-lg font-bold text-white">
                          GoHighLevel API Key Walkthrough
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 mb-4">
                          Watch this Loom to see exactly where to find your GoHighLevel API Key.
                        </p>
                      </div>
                      <div
                        className="w-full"
                        dangerouslySetInnerHTML={{
                          __html:
                            '<div class="lo-emb-vid" style="position: relative; padding-bottom: 74.96025437201908%; height: 0;"><iframe src="https://www.loom.com/embed/ddddc95b67af403da31aba438129ba21" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>',
                        }}
                      />
                    </div>

                    {ghlSuccess ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 animate-fade-in">
                        <div className="flex items-center">
                          <svg
                            className="w-6 h-6 text-emerald-400 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-emerald-200 font-bold">
                            GoHighLevel connected successfully!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleGhlConnect} className="space-y-6">
                        <div>
                          <label
                            htmlFor="ghl-key"
                            className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide"
                          >
                            GoHighLevel API Key (V2)
                          </label>
                          <input
                            id="ghl-key"
                            type="password"
                            value={ghlApiKey}
                            onChange={(e) => setGhlApiKey(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-600 transition-all"
                            placeholder="Enter your GHL API Key"
                          />
                          {ghlError && (
                            <p className="mt-2 text-sm text-rose-400 font-medium animate-pulse">
                              {ghlError}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={ghlLoading}
                          className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                        >
                          {ghlLoading ? 'Connecting...' : 'Connect GoHighLevel'}
                        </button>
                      </form>
                    )}
                  </>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all"
                  >
                    Back
                  </button>
                  {(closeSuccess || ghlSuccess) && (
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-1"
                    >
                      Continue to Stripe
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Stripe Integration */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Step 4 – Connect Stripe
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    Connect your Stripe account to track payments, revenue, and
                    financial metrics. This enables us to calculate important KPIs
                    like revenue per customer, payment success rates, and identify
                    revenue opportunities.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-400 mr-4 mt-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-100 mb-3">
                        Secure Your API Key with Restricted Access
                      </h3>
                      <p className="text-blue-200 mb-4 leading-relaxed">
                        <strong>You can restrict access to your Stripe account</strong> by creating a restricted API key with limited permissions. This is highly recommended for security.
                      </p>
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 mb-4">
                        <p className="text-sm font-bold text-blue-100 mb-2">
                          We only require <strong>read-only</strong> access to:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-200 space-y-1">
                          <li><strong>Charges</strong> - Read charges</li>
                          <li><strong>Subscriptions</strong> - Read subscriptions</li>
                          <li><strong>Invoices</strong> - Read invoices</li>
                        </ul>
                      </div>
                      <p className="text-sm text-blue-300 mt-3">
                        <strong>Important:</strong> We cannot create, modify, or delete any data in your Stripe account. We can only read the data needed to calculate your metrics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
                  <div className="px-6 pt-6">
                    <h3 className="text-lg font-bold text-white">
                      Stripe Settings Walkthrough
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 mb-4">
                      Watch this video to see exactly where to pull your Stripe API keys.
                    </p>
                  </div>
                  <div className="w-full" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src="https://www.youtube.com/embed/oqSd3b4Is2Y?si=Dz5tGqkKZ8Vjgus-&modestbranding=1&rel=0"
                      title="YouTube video player"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>

                {stripeSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 animate-fade-in">
                    <div className="flex items-center">
                      <svg
                        className="w-6 h-6 text-emerald-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-emerald-200 font-bold">
                        Stripe connected successfully!
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStripeConnect} className="space-y-6">
                    <div>
                      <label
                        htmlFor="stripe-key"
                        className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide"
                      >
                        Stripe API key
                      </label>
                      <input
                        id="stripe-key"
                        type="password"
                        value={stripeApiKey}
                        onChange={(e) => setStripeApiKey(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-600 transition-all"
                        placeholder="Enter your Stripe API key"
                      />
                      {stripeError && (
                        <p className="mt-2 text-sm text-rose-400 font-medium animate-pulse">
                          {stripeError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={stripeLoading}
                      className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                    >
                      {stripeLoading ? 'Connecting...' : 'Connect Stripe'}
                    </button>
                  </form>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all"
                  >
                    Back
                  </button>
                  {stripeSuccess && (
                    <div className="flex items-center text-emerald-400 font-bold animate-pulse">
                      <span className="mr-2">Redirecting to dashboard...</span>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
