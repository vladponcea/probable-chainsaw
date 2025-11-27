'use client';

import { useState, useEffect } from 'react';
import { statusMappingApi, StatusMapping } from '@/lib/api';

interface StatusMappingEditorProps {
  token: string;
}

export default function StatusMappingEditor({
  token,
}: StatusMappingEditorProps) {
  const [mappings, setMappings] = useState<StatusMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, [token]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusMappingApi.getMappings(token);
      setMappings(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load status mappings',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const data = await statusMappingApi.syncMappings(token);
      setMappings(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to sync status mappings',
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (statusId: string, currentValue: boolean) => {
    try {
      setError(null);
      const updated = await statusMappingApi.updateMapping(token, statusId, {
        showedUp: !currentValue,
      });
      setMappings((prev) =>
        prev.map((m) => (m.statusId === statusId ? updated : m)),
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update status mapping',
      );
    }
  };

  const handleBulkSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updates = mappings.map((m) => ({
        statusId: m.statusId,
        showedUp: m.showedUp,
      }));
      await statusMappingApi.bulkUpdateMappings(token, { mappings: updates });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to save status mappings',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading status mappings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Opportunity Status Mapping
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Map each Close CRM opportunity status to indicate whether it means
              the customer showed up for their call. This is used to calculate
              show-up rates.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
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
                Sync from Close
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              Status mappings updated successfully!
            </p>
          </div>
        )}
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            No status mappings found. Click "Sync from Close" to fetch your
            opportunity statuses.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Name
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Showed Up
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mapping.statusLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mapping.showedUp}
                          onChange={() =>
                            handleToggle(mapping.statusId, mapping.showedUp)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save All Changes'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

