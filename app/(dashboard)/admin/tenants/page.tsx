import Link from 'next/link';
import { getTenants } from '@/lib/actions/tenants';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const page = parseInt(searchParams.page || '1');
  const { tenants, total, totalPages } = await getTenants({
    page,
    pageSize: 20,
    search: searchParams.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage tenant organizations in the system
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Add Tenant
        </Link>
      </div>

      {/* Search Filter */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search tenants..."
              defaultValue={searchParams.search}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No tenants found. <Link href="/admin/tenants/new" className="text-teal-600 hover:text-teal-900">Create your first tenant</Link>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      {tenant.settings?.branding?.primaryColor && (
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: tenant.settings.branding.primaryColor }}
                          />
                          <span className="text-xs text-gray-500">Branded</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-mono font-medium rounded-md bg-teal-100 text-teal-800">
                        {tenant.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {tenant.contactInfo?.email || '-'}
                      </div>
                      {tenant.contactInfo?.phone && (
                        <div className="text-xs text-gray-500">{tenant.contactInfo.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant._count.tenantUsers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant._count.clients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant._count.documents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/admin/tenants/${tenant.id}`} className="text-teal-600 hover:text-teal-900 font-medium mr-4">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/tenants?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
              >
                Previous
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/admin/tenants?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={`/admin/tenants?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
