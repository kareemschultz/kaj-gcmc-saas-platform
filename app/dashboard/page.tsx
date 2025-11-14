import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | KGC Compliance Cloud',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your compliance operations</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <p className="text-xs text-green-600 mt-4">↑ 12% from last month</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
          <p className="text-xs text-green-600 mt-4">↑ 8% from last month</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Filings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">89</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
          <p className="text-xs text-orange-600 mt-4">5 due this week</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
            </div>
            <div className="text-4xl">⚙️</div>
          </div>
          <p className="text-xs text-blue-600 mt-4">3 in progress</p>
        </div>
      </div>
      
      {/* Activity Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">New client added: ABC Corp</span>
              <span className="text-gray-400 text-xs ml-auto">2h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Document uploaded: Tax Certificate</span>
              <span className="text-gray-400 text-xs ml-auto">5h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Filing submitted: GRA VAT Return</span>
              <span className="text-gray-400 text-xs ml-auto">1d ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Service request created: Annual Return</span>
              <span className="text-gray-400 text-xs ml-auto">2d ago</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-red-50 border border-red-200">
              <div>
                <p className="text-sm font-medium text-gray-900">NIS Contributions</p>
                <p className="text-xs text-gray-500">Client: XYZ Ltd</p>
              </div>
              <span className="text-sm text-red-600 font-medium">Due in 5 days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-orange-50 border border-orange-200">
              <div>
                <p className="text-sm font-medium text-gray-900">GRA Corporate Tax</p>
                <p className="text-xs text-gray-500">Client: ABC Corp</p>
              </div>
              <span className="text-sm text-orange-600 font-medium">Due in 12 days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-green-50 border border-green-200">
              <div>
                <p className="text-sm font-medium text-gray-900">DCRA Annual Return</p>
                <p className="text-xs text-gray-500">Client: DEF Inc</p>
              </div>
              <span className="text-sm text-green-600 font-medium">Due in 28 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
