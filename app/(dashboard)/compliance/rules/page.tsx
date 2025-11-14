import Link from 'next/link';
import { getComplianceRuleSets } from '@/lib/actions/compliance-rules';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ComplianceRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; active?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const active = params.active === 'true' ? true : params.active === 'false' ? false : undefined;

  const { ruleSets, total, totalPages } = await getComplianceRuleSets({
    page,
    pageSize: 20,
    search: params.search,
    active,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Rule Sets</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage compliance rules and requirements for your organization
          </p>
        </div>
        <Link
          href="/compliance/rules/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Add Rule Set
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              name="search"
              placeholder="Search rule sets..."
              defaultValue={params.search}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="active"
              defaultValue={params.active || ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Rule Sets Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applies To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rules</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ruleSets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No rule sets found. <Link href="/compliance/rules/new" className="text-teal-600 hover:text-teal-900">Create your first rule set</Link>
                  </td>
                </tr>
              ) : (
                ruleSets.map((ruleSet: any) => {
                  const appliesTo = ruleSet.appliesTo as { clientTypes?: string[]; sectors?: string[] } | null;
                  const clientTypes = appliesTo?.clientTypes || [];
                  const sectors = appliesTo?.sectors || [];

                  return (
                    <tr key={ruleSet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{ruleSet.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {clientTypes.length > 0 && (
                            <div className="mb-1">
                              <span className="font-medium">Types: </span>
                              {clientTypes.slice(0, 2).join(', ')}
                              {clientTypes.length > 2 && ` +${clientTypes.length - 2} more`}
                            </div>
                          )}
                          {sectors.length > 0 && (
                            <div>
                              <span className="font-medium">Sectors: </span>
                              {sectors.slice(0, 2).join(', ')}
                              {sectors.length > 2 && ` +${sectors.length - 2} more`}
                            </div>
                          )}
                          {clientTypes.length === 0 && sectors.length === 0 && (
                            <span className="text-gray-400">All clients</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ruleSet._count.rules} rules
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ruleSet.active
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ruleSet.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/compliance/rules/${ruleSet.id}`} className="text-teal-600 hover:text-teal-900 font-medium mr-4">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
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
                href={`/compliance/rules?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
              >
                Previous
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p: any) => (
                <Link
                  key={p}
                  href={`/compliance/rules?page=${p}${params.search ? `&search=${params.search}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={`/compliance/rules?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.active ? `&active=${params.active}` : ''}`}
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
