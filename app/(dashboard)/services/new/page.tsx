import { ServiceForm } from '@/components/services/service-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewServicePage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Service</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define a new service offering for your organization
          </p>
        </div>
        <Link
          href="/services"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Services
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ServiceForm />
      </div>
    </div>
  );
}
