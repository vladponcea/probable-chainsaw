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
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-800 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${status === 'Success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
            <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75 ${status === 'Success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Last Sync</p>
            <p className="text-sm font-medium text-slate-200 flex items-center">
              {formatLastSync(lastSync)}
              <span className="mx-2 text-slate-600">•</span>
              <span className={status === 'Success' ? 'text-emerald-400' : 'text-amber-400'}>{status}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center"
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
              <span className="text-xs font-medium text-slate-300">
                {progress.currentStep}
              </span>
              <span className="text-xs text-slate-400">{progress.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Logs */}
          {progress.logs.length > 0 && (
            <div className="bg-slate-800/50 rounded border border-slate-700 p-3 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {progress.logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono text-slate-300"
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
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
          ✓ Sync completed successfully
        </div>
      )}

      {progress && progress.status === 'error' && (
        <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
          ✗ Sync completed with errors
        </div>
      )}
    </div>
  );
}

