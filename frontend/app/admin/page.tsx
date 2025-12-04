'use client';

import { useState, useEffect } from 'react';
import { clientsApi, AdminClient, CreateClientRequest } from '@/lib/api';
import Link from 'next/link';

export default function AdminPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState<CreateClientRequest>({
    email: '',
    companyName: '',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      window.location.href = '/admin/login';
      return;
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load clients',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await clientsApi.create(formData);
      setShowCreateModal(false);
      setFormData({ email: '', companyName: '' });
      await fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, companyName: string | null) => {
    if (
      !confirm(
        `Are you sure you want to delete ${companyName || 'this client'}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await clientsApi.delete(id);
      await fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchClients}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Panel
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage all clients
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Client
              </button>
              <button
                onClick={fetchClients}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Create Client Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Client
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ email: '', companyName: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email (optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    placeholder="client@example.com"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ email: '', companyName: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !formData.companyName?.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No clients yet
              </h3>
              <p className="text-gray-600 mb-4">
                Clients will appear here once they are created.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Client
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Integrations
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Onboarding
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Dashboard
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.companyName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-[120px]">
                          {client.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${client.calendlyConnected
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                            title={client.calendlyConnected ? 'Calendly Connected' : 'Calendly Not Connected'}
                          >
                            {client.calendlyConnected ? (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            )}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${client.closeConnected
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                            title={client.closeConnected ? 'Close Connected' : 'Close Not Connected'}
                          >
                            {client.closeConnected ? (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            )}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${client.stripeConnected
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                            title={client.stripeConnected ? 'Stripe Connected' : 'Stripe Not Connected'}
                          >
                            {client.stripeConnected ? (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-600">
                          {client._count.integrations} integration{client._count.integrations !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium">
                        <Link
                          href={`/onboarding/${client.onboardingToken}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                          title="View Onboarding"
                        >
                          Go to Onboarding
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-sm font-medium">
                        <Link
                          href={`/dashboard/${client.onboardingToken}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                          title="View Dashboard"
                        >
                          Go to Dashboard
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleDelete(client.id, client.companyName)}
                          disabled={deletingId === client.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Client"
                        >
                          {deletingId === client.id ? (
                            <svg
                              className="animate-spin h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {clients.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Total: <span className="font-semibold">{clients.length}</span>{' '}
            client{clients.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
