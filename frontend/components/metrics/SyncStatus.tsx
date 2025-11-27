'use client';

import { SyncProgress } from '@/lib/api';

interface SyncStatusProps {
  lastSync: string | null;
  status: string;
  onSync: () => void;
  isSyncing: boolean;
  progress?: SyncProgress | null;
}

export default function SyncStatus({
  lastSync,
  status,
  onSync,
  isSyncing,
  progress,
}: SyncStatusProps) {
  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const showProgress = isSyncing && progress && progress.status === 'syncing';

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Last Sync</p>
            <p className="text-xs text-gray-500">
              {formatLastSync(lastSync)} • {status}
            </p>
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSyncing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Sync Now
            </>
          )}
        </button>
      </div>

      {showProgress && (
        <div className="mt-4 space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">
                {progress.currentStep}
              </span>
              <span className="text-xs text-gray-500">{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Logs */}
          {progress.logs.length > 0 && (
            <div className="bg-white rounded border border-gray-200 p-3 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {progress.logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-gray-600"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {progress && progress.status === 'completed' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✓ Sync completed successfully
        </div>
      )}

      {progress && progress.status === 'error' && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          ✗ Sync completed with errors
        </div>
      )}
    </div>
  );
}

