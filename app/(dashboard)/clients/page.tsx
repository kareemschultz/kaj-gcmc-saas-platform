import Link from 'next/link';
import { getClients } from '@/lib/actions/clients';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string; sector?: string; riskLevel?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { clients, pagination: { total, totalPages } } = await getClients({
    page,
    pageSize: 10,
    search: params.search,
    type: params.type,
    sector: params.sector,
    riskLevel: params.riskLevel,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage individual and corporate clients
          </p>
        </div>
        <Link 
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
              <option value="Partnership">Partnership</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No clients found. <Link href="/clients/new" className="text-teal-600 hover:text-teal-900">Create your first client</Link>
                  </td>
                </tr>
              ) : (
                clients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.sector || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.riskLevel && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          client.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          client.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {client.riskLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.type === 'individual' ? 'Self' : client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/clients/${client.id}`} className="text-teal-600 hover:text-teal-900 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * 10, total)}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clients?page=${page - 1}${params.search ? `&search=${params.search}` : ''}`}
              className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
            >
              Previous
            </Link>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p: any) => (
              <Link
                key={p}
                href={`/clients?page=${p}${params.search ? `&search=${params.search}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${
                  p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/clients?page=${page + 1}${params.search ? `&search=${params.search}` : ''}`}
              className={`px-3 py-1 text-sm border rounded-md ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
