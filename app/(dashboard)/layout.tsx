import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockUser = {
    id: 1,
    name: 'Demo User',
    email: 'demo@kgc.gy',
    tenantCode: 'KAJ',
    role: 'admin',
  };

  const mockTenant = {
    tenantId: 1,
    tenantCode: 'KAJ',
    tenantName: 'KAJ & Associates',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AppSidebar tenantCode="KAJ" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={mockUser} tenant={mockTenant} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
