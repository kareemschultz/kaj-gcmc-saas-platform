import Link from 'next/link';

export default function FilingsPage() {
  const mockFilings = [
    { id: 1, name: 'VAT Return Q1 2024', client: 'ABC Corporation', type: 'VAT Return', authority: 'GRA', status: 'Submitted', dueDate: '2024-04-15', submittedDate: '2024-04-10', amount: 125000 },
    { id: 2, name: 'Corporate Tax 2023', client: 'XYZ Limited', type: 'Corporate Tax', authority: 'GRA', status: 'In Progress', dueDate: '2024-03-31', submittedDate: null, amount: 450000 },
    { id: 3, name: 'NIS Contributions Feb 2024', client: 'ABC Corporation', type: 'NIS Contributions', authority: 'NIS', status: 'Overdue', dueDate: '2024-03-10', submittedDate: null, amount: 28500 },
    { id: 4, name: 'Annual Return 2023', client: 'DEF Partnership', type: 'Annual Return', authority: 'DCRA', status: 'Draft', dueDate: '2024-05-30', submittedDate: null, amount: 0 },
    { id: 5, name: 'Work Permit Renewal', client: 'John Williams', type: 'Work Permit', authority: 'Immigration', status: 'Submitted', dueDate: '2024-03-15', submittedDate: '2024-03-12', amount: 15000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Filings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage tax and regulatory filings
          </p>
        </div>
        <Link 
          href="/filings/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          New Filing
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search filings..."
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
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filings Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filing Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (GYD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockFilings.map((filing) => (
                <tr key={filing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{filing.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {filing.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {filing.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      filing.authority === 'GRA' ? 'bg-yellow-100 text-yellow-800' :
                      filing.authority === 'NIS' ? 'bg-green-100 text-green-800' :
                      filing.authority === 'DCRA' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {filing.authority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      filing.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                      filing.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      filing.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {filing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {filing.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {filing.amount > 0 ? `$${filing.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/filings/${filing.id}`} className="text-teal-600 hover:text-teal-900 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
            <span className="font-medium">89</span> results
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 text-sm border rounded-md bg-teal-600 text-white">
              1
            </button>
            <button className="px-3 py-1 text-sm border rounded-md bg-white text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 text-sm border rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
