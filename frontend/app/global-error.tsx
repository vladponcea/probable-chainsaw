'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-slate-950 text-white">
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold mb-4 text-rose-500">Critical Error</h2>
                        <p className="text-slate-400 mb-6">
                            {error.message || 'A critical error occurred.'}
                        </p>
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
