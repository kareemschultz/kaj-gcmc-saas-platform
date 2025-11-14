import { getTenant } from '@/src/lib/actions/tenants';
import { TenantForm } from '@/components/tenants/tenant-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditTenantPage({
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
    const tenant = await getTenant(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {tenant.name} details
            </p>
          </div>
          <Link
            href="/admin/tenants"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Tenants
          </Link>
        </div>

        {/* Statistics */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Tenant Statistics</h2>
          <dl className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Users</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-600">
                {tenant._count.tenantUsers}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Clients</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-600">
                {tenant._count.clients}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Documents</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-600">
                {tenant._count.documents}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Filings</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-600">
                {tenant._count.filings}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Requests</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-600">
                {tenant._count.serviceRequests}
              </dd>
            </div>
          </dl>
        </div>

        {/* Settings Form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-900">Tenant Settings</h2>
          <TenantForm tenant={tenant} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
