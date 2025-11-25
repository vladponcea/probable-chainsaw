import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Onboarding Flow
        </h1>
        <p className="text-gray-600 mb-8">
          Use the API to create a client and get an onboarding token, then
          visit /onboarding/[token]
        </p>
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>Example: POST /api/clients to create a client</p>
            <p>Then visit: /onboarding/[your-token]</p>
          </div>
          <div className="flex justify-center space-x-4">
            <Link
              href="/admin"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

