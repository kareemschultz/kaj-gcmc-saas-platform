import { getService } from '@/src/lib/actions/services';
import { ServiceForm } from '@/components/services/service-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  try {
    const service = await getService(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {service.name} details
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
          <ServiceForm service={service} />
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Requests</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {service._count.serviceRequests}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Templates</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {service._count.templates}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(service.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
