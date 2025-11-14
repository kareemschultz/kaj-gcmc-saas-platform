import Link from 'next/link';
import { getFilingTypes } from '@/lib/actions/filing-types';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function FilingTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; authority?: string; frequency?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { filingTypes, total, totalPages } = await getFilingTypes({
    page,
    pageSize: 20,
    search: params.search,
    authority: params.authority,
    frequency: params.frequency,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Filing Types</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage filing type definitions for compliance requirements
          </p>
        </div>
        <Link
          href="/filing-types/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Add Filing Type
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search filing types..."
              defaultValue={params.search}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authority</label>
            <select
              defaultValue={params.authority}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Authorities</option>
              <option value="GRA">GRA</option>
              <option value="NIS">NIS</option>
              <option value="DCRA">DCRA</option>
              <option value="Immigration">Immigration</option>
              <option value="Deeds Registry">Deeds Registry</option>
              <option value="Go-Invest">Go-Invest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              defaultValue={params.frequency}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Frequencies</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="one_off">One-Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filing Types Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filingTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No filing types found. <Link href="/filing-types/new" className="text-teal-600 hover:text-teal-900">Create your first filing type</Link>
                  </td>
                </tr>
              ) : (
                filingTypes.map((filingType: any) => (
                  <tr key={filingType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{filingType.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">{filingType.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {filingType.authority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
                        {filingType.frequency.replace('_', '-')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate">
                        {filingType.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {filingType._count.filings} filings
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/filing-types/${filingType.id}`} className="text-teal-600 hover:text-teal-900 font-medium mr-4">
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
                href={`/filing-types?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.authority ? `&authority=${params.authority}` : ''}${params.frequency ? `&frequency=${params.frequency}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
              >
                Previous
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p: any) => (
                <Link
                  key={p}
                  href={`/filing-types?page=${p}${params.search ? `&search=${params.search}` : ''}${params.authority ? `&authority=${params.authority}` : ''}${params.frequency ? `&frequency=${params.frequency}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={`/filing-types?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.authority ? `&authority=${params.authority}` : ''}${params.frequency ? `&frequency=${params.frequency}` : ''}`}
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
