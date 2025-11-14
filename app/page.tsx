import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            KGC Compliance Cloud
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Multi-Tenant SaaS Platform for Compliance Management
          </p>
          <p className="text-sm text-gray-500">
            Serving KAJ Accounting & GCMC in Guyana
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2 mb-12">
          <Link 
            href="/auth/login"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
            <p className="text-gray-600">Access your compliance dashboard</p>
          </Link>

          <Link 
            href="/dashboard"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">View compliance overview and stats</p>
          </Link>

          <Link 
            href="/clients"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Clients</h2>
            <p className="text-gray-600">Manage client information and risk profiles</p>
          </Link>

          <Link 
            href="/documents"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents</h2>
            <p className="text-gray-600">Upload and manage compliance documents</p>
          </Link>

          <Link 
            href="/filings"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Filings</h2>
            <p className="text-gray-600">Track tax and regulatory submissions</p>
          </Link>

          <Link 
            href="/mockup"
            className="block p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">UI Mockup</h2>
            <p className="text-gray-600">Preview the complete design system</p>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="text-teal-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-900">Multi-Tenant Architecture</div>
                <div className="text-sm text-gray-600">Row-level data isolation</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-teal-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-900">Document Management</div>
                <div className="text-sm text-gray-600">MinIO storage with versioning</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-teal-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-900">Compliance Tracking</div>
                <div className="text-sm text-gray-600">GRA, NIS, DCRA, Immigration</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-teal-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-900">Role-Based Access</div>
                <div className="text-sm text-gray-600">8 predefined user roles</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
