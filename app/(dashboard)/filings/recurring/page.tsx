import Link from 'next/link';
import { getRecurringFilings, toggleRecurringFilingActive } from '@/lib/actions/recurring-filings';
import { getFilingTypes, getClientsForFilingSelect } from '@/lib/actions/filings';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ToggleActiveButton } from './toggle-active-button';

export default async function RecurringFilingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; clientId?: string; filingTypeId?: string; active?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const active = params.active === 'true' ? true : params.active === 'false' ? false : undefined;

  const [result, filingTypes, clients] = await Promise.all([
    getRecurringFilings({
      page,
      pageSize: 10,
      search: params.search,
      clientId: params.clientId ? parseInt(params.clientId) : undefined,
      filingTypeId: params.filingTypeId ? parseInt(params.filingTypeId) : undefined,
      active,
    }),
    getFilingTypes(),
    getClientsForFilingSelect(),
  ]);

  const { recurringFilings, total, totalPages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Filings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automated recurring filing schedules
          </p>
        </div>
        <Link
          href="/filings/recurring/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          New Recurring Filing
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="Search filings..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              name="clientId"
              defaultValue={params.clientId}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filing Type</label>
            <select
              name="filingTypeId"
              defaultValue={params.filingTypeId}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Filing Types</option>
              {filingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="active"
              defaultValue={params.active}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </form>
      </div>

      {/* Recurring Filings Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filing Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurringFilings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No recurring filings found.{' '}
                    <Link href="/filings/recurring/new" className="text-teal-600 hover:text-teal-900">
                      Create your first recurring filing
                    </Link>
                  </td>
                </tr>
              ) : (
                recurringFilings.map((filing) => (
                  <tr key={filing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{filing.client.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{filing.client.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {filing.clientBusiness?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{filing.filingType.name}</div>
                      <div className="text-xs text-gray-500">{filing.filingType.authority}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800 capitalize">
                        {filing.schedule}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {filing.lastRunAt ? format(new Date(filing.lastRunAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {filing.nextRunAt ? format(new Date(filing.nextRunAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {filing.active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <Link
                        href={`/filings/recurring/${filing.id}`}
                        className="text-teal-600 hover:text-teal-900 font-medium"
                      >
                        Edit
                      </Link>
                      <ToggleActiveButton id={filing.id} active={filing.active} />
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
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 10, total)}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </div>
            <div className="flex gap-2">
              <Link
                href={`/filings/recurring?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.clientId ? `&clientId=${params.clientId}` : ''}${params.filingTypeId ? `&filingTypeId=${params.filingTypeId}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${
                  page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'
                } bg-white text-gray-700`}
              >
                Previous
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/filings/recurring?page=${p}${params.search ? `&search=${params.search}` : ''}${params.clientId ? `&clientId=${params.clientId}` : ''}${params.filingTypeId ? `&filingTypeId=${params.filingTypeId}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={`/filings/recurring?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.clientId ? `&clientId=${params.clientId}` : ''}${params.filingTypeId ? `&filingTypeId=${params.filingTypeId}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${
                  page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'
                } bg-white text-gray-700`}
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
