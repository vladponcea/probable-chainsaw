'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { clientsApi, Client } from '@/lib/api';

export default function DashboardPage() {
  const params = useParams();
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
        err.response?.data?.message || 'Failed to load dashboard data',
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Dashboard coming soon
            </h2>
            <p className="text-blue-800">
              Dashboard coming soon for{' '}
              <span className="font-semibold">
                {client?.companyName || 'your company'}
              </span>
              .
            </p>
            <p className="text-blue-700 text-sm mt-4">
              Your integrations are connected and data syncing will begin
              shortly. Check back soon to see your KPIs and insights!
            </p>
          </div>

          {client && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Calendly
                </h3>
                <p
                  className={`text-lg font-semibold ${
                    client.calendlyConnected
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {client.calendlyConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Close CRM
                </h3>
                <p
                  className={`text-lg font-semibold ${
                    client.closeConnected ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {client.closeConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

