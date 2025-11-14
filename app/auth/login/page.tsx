import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | KGC Compliance Cloud',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">KGC Compliance Cloud</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-md bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700 transition-colors"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Credentials:</p>
            <p className="mt-2 font-mono text-xs">
              KAJ: kaj-admin@test.com / password123<br />
              GCMC: gcmc-admin@test.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
