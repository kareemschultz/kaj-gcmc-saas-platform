import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockUser = {
    id: '1',
    name: 'Demo User',
    email: 'demo@kgc.gy',
    tenantCode: 'KAJ',
    role: 'admin',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AppSidebar tenantCode="KAJ" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={mockUser} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
