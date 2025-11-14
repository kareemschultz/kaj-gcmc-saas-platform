import Link from 'next/link';
import { getDocuments } from '@/lib/actions/documents';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string; authority?: string };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const page = parseInt(searchParams.page || '1');
  const { documents, total, totalPages } = await getDocuments({
    page,
    pageSize: 10,
    search: searchParams.search,
    status: searchParams.status,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage client documents and compliance files
          </p>
        </div>
        <Link 
          href="/documents/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Upload Document
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Clients</option>
              <option value="1">ABC Corporation</option>
              <option value="2">XYZ Limited</option>
              <option value="3">John Williams</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authority</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Authorities</option>
              <option value="GRA">GRA</option>
              <option value="NIS">NIS</option>
              <option value="DCRA">DCRA</option>
              <option value="Immigration">Immigration</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No documents found. <Link href="/documents/new" className="text-teal-600 hover:text-teal-900">Upload your first document</Link>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doc.client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {doc.documentType.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.authority && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.authority === 'GRA' ? 'bg-yellow-100 text-yellow-800' :
                          doc.authority === 'NIS' ? 'bg-green-100 text-green-800' :
                          doc.authority === 'DCRA' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.authority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        doc.status === 'valid' ? 'bg-green-100 text-green-800' :
                        doc.status === 'expired' ? 'bg-red-100 text-red-800' :
                        doc.status === 'pending_review' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doc.latestVersion?.issueDate ? format(new Date(doc.latestVersion.issueDate), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {doc.latestVersion?.expiryDate ? format(new Date(doc.latestVersion.expiryDate), 'yyyy-MM-dd') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/documents/${doc.id}`} className="text-teal-600 hover:text-teal-900 font-medium">
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
              href={`/documents?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
              className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'} bg-white text-gray-700`}
            >
              Previous
            </Link>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/documents?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className={`px-3 py-1 text-sm border rounded-md ${
                  p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/documents?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
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
