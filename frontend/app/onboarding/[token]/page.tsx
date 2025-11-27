'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stepper from '@/components/Stepper';
import VideoSection from '@/components/VideoSection';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <p className="text-sm text-gray-500 mt-4">
            The onboarding token may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Connect Your Tools
          </h1>

          <Stepper
            currentStep={currentStep}
            calendlyConnected={client?.calendlyConnected || false}
            closeConnected={client?.closeConnected || client?.ghlConnected || false}
            stripeConnected={client?.stripeConnected || false}
            onStepClick={handleStepClick}
          />

          <div className="mt-8">
            {/* Step 1: Introduction */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Connect your tools to generate your free ops dashboard
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Welcome! You're here to connect your essential business
                    tools so we can generate a comprehensive operations dashboard
                    for you. This dashboard will show you key performance
                    indicators (KPIs) and help you identify opportunities where
                    you might be leaving money on the table.
                  </p>
                  <p className="text-gray-600 mb-6">
                    By connecting Calendly, Close CRM, and Stripe, we'll analyze your
                    sales pipeline, call metrics, lead conversion rates, payment data,
                    and more to give you actionable insights.
                  </p>
                </div>

                <VideoSection
                  title="Introduction Video"
                  description="Watch this short video to learn how our dashboard can help you optimize your operations."
                  videoUrl="https://example.com/intro.mp4"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Calendly Integration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Step 2 – Connect Calendly
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Connect your Calendly account to track booked calls,
                    cancellations, and show-up rates. This data helps us
                    calculate important metrics like call completion rates and
                    identify patterns in your scheduling.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
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
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        API Token Security & Data Access
                      </h3>
                      <p className="text-blue-800 mb-3">
                        <strong>Note:</strong> Calendly does not support restricted API tokens with limited permissions. Personal Access Tokens (PATs) grant access based on your user role. However, we want you to know exactly how we use your token.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          We only <strong>READ</strong> the following data:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                          <li><strong>Scheduled Events</strong> - Read your scheduled meetings and their status</li>
                        </ul>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-blue-700">
                          <strong>Important:</strong> We <strong>never</strong> create, modify, or delete any data in your Calendly account. We can only read scheduled events to calculate your booking and cancellation metrics.
                        </p>
                        <p className="text-sm text-blue-700">
                          <strong>Security Best Practice:</strong> We recommend creating a dedicated Personal Access Token specifically for this integration. You can monitor its usage and revoke it anytime in Calendly Settings → Integrations → API & Webhooks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
                  <div className="px-6 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Calendly Scheduling Walkthrough
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <svg
                        className="w-6 h-6 text-green-600 mr-2"
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
                      <span className="text-green-800 font-semibold">
                        Calendly connected successfully!
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCalendlyConnect} className="space-y-4">
                    <div>
                      <label
                        htmlFor="calendly-key"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Calendly API key
                      </label>
                      <input
                        id="calendly-key"
                        type="password"
                        value={calendlyApiKey}
                        onChange={(e) => setCalendlyApiKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        placeholder="Enter your Calendly API key"
                      />
                      {calendlyError && (
                        <p className="mt-2 text-sm text-red-600">
                          {calendlyError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={calendlyLoading}
                      className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {calendlyLoading ? 'Connecting...' : 'Connect Calendly'}
                    </button>
                  </form>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  {calendlySuccess && (
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Continue to Close CRM
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: CRM Integration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Step 3 – Connect CRM
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Connect your CRM to sync leads, pipeline data, and
                    CRM hygiene metrics. This enables us to track your sales
                    funnel, conversion rates, and identify opportunities for
                    improvement.
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose your CRM
                    </label>
                    <select
                      value={selectedCrm}
                      onChange={(e) => setSelectedCrm(e.target.value as 'close' | 'ghl')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      disabled={closeSuccess || ghlSuccess}
                    >
                      <option value="close">Close CRM</option>
                      <option value="ghl">GoHighLevel</option>
                    </select>
                  </div>
                </div>

                {selectedCrm === 'close' ? (
                  <>
                    {/* Security Notice for Close */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <svg
                          className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
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
                          <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            API Key Security & Data Access
                          </h3>
                          <p className="text-blue-800 mb-3">
                            <strong>Note:</strong> Close CRM does not support restricted API keys with limited permissions. All API keys provide full account access. However, we want you to know exactly how we use your API key.
                          </p>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-sm font-semibold text-blue-900 mb-2">
                              We only <strong>READ</strong> the following data:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                              <li><strong>Leads</strong> - Read lead information and status</li>
                              <li><strong>Opportunities (Deals)</strong> - Read deal values, stages, and status</li>
                              <li><strong>Activities</strong> - Read calls, emails, and SMS to calculate first contact dates</li>
                            </ul>
                          </div>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-blue-700">
                              <strong>Important:</strong> We <strong>never</strong> create, modify, or delete any data in your Close CRM account. We can only read the data needed to calculate your metrics.
                            </p>
                            <p className="text-sm text-blue-700">
                              <strong>Security Best Practice:</strong> We recommend creating a dedicated API key specifically for this integration. You can monitor its usage and revoke it anytime in Close CRM Settings → Developer → API Keys.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
                      <div className="px-6 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Close CRM API Key Walkthrough
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 mb-4">
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
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <svg
                            className="w-6 h-6 text-green-600 mr-2"
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
                          <span className="text-green-800 font-semibold">
                            Close CRM connected successfully!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCloseConnect} className="space-y-4">
                        <div>
                          <label
                            htmlFor="close-key"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Close CRM API key
                          </label>
                          <input
                            id="close-key"
                            type="password"
                            value={closeApiKey}
                            onChange={(e) => setCloseApiKey(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                            placeholder="Enter your Close CRM API key"
                          />
                          {closeError && (
                            <p className="mt-2 text-sm text-red-600">
                              {closeError}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={closeLoading}
                          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {closeLoading ? 'Connecting...' : 'Connect Close CRM'}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    {/* Security Notice for GHL */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <svg
                          className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
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
                          <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            API Key Security & Data Access
                          </h3>
                          <p className="text-blue-800 mb-3">
                            <strong>Note:</strong> We use your GoHighLevel API Key (V2) to access your account data.
                          </p>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-sm font-semibold text-blue-900 mb-2">
                              We only <strong>READ</strong> the following data:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                              <li><strong>Contacts</strong> - Read contact information</li>
                              <li><strong>Opportunities</strong> - Read opportunity values, stages, and status</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
                      <div className="px-6 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          GoHighLevel API Key Walkthrough
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 mb-4">
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
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <svg
                            className="w-6 h-6 text-green-600 mr-2"
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
                          <span className="text-green-800 font-semibold">
                            GoHighLevel connected successfully!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleGhlConnect} className="space-y-4">
                        <div>
                          <label
                            htmlFor="ghl-key"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            GoHighLevel API Key (V2)
                          </label>
                          <input
                            id="ghl-key"
                            type="password"
                            value={ghlApiKey}
                            onChange={(e) => setGhlApiKey(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                            placeholder="Enter your GHL API Key"
                          />
                          {ghlError && (
                            <p className="mt-2 text-sm text-red-600">
                              {ghlError}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={ghlLoading}
                          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ghlLoading ? 'Connecting...' : 'Connect GoHighLevel'}
                        </button>
                      </form>
                    )}
                  </>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  {(closeSuccess || ghlSuccess) && (
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Continue to Stripe
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Stripe Integration */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Step 4 – Connect Stripe
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Connect your Stripe account to track payments, revenue, and
                    financial metrics. This enables us to calculate important KPIs
                    like revenue per customer, payment success rates, and identify
                    revenue opportunities.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
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
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        Secure Your API Key with Restricted Access
                      </h3>
                      <p className="text-blue-800 mb-3">
                        <strong>You can restrict access to your Stripe account</strong> by creating a restricted API key with limited permissions. This is highly recommended for security.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          We only require <strong>read-only</strong> access to:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                          <li><strong>Charges</strong> - Read charges</li>
                          <li><strong>Subscriptions</strong> - Read subscriptions</li>
                          <li><strong>Invoices</strong> - Read invoices</li>
                        </ul>
                      </div>
                      <p className="text-sm text-blue-700 mt-3">
                        <strong>Important:</strong> We cannot create, modify, or delete any data in your Stripe account. We can only read the data needed to calculate your metrics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
                  <div className="px-6 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Stripe Settings Walkthrough
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
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
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-green-600 mr-2"
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
                        <span className="text-green-800 font-semibold">
                          Stripe connected successfully!
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">
                        You're all set! Your data will start syncing soon.
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-green-700">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Calendly connected
                        </div>
                        <div className="flex items-center text-green-700">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Close connected
                        </div>
                        <div className="flex items-center text-green-700">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {client?.ghlConnected ? 'GoHighLevel connected' : 'Close connected'}
                        </div>
                        <div className="flex items-center text-green-700">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Stripe connected
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => router.push(`/dashboard/${token}`)}
                        className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Go to dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStripeConnect} className="space-y-4">
                    <div>
                      <label
                        htmlFor="stripe-key"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Stripe API key
                      </label>
                      <input
                        id="stripe-key"
                        type="password"
                        value={stripeApiKey}
                        onChange={(e) => setStripeApiKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        placeholder="Enter your Stripe API key (sk_ or rk_ for restricted keys)"
                      />
                      {stripeError && (
                        <p className="mt-2 text-sm text-red-600">
                          {stripeError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={stripeLoading}
                      className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading ? 'Connecting...' : 'Connect Stripe'}
                    </button>
                  </form>
                )}

                <div className="flex justify-start">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

