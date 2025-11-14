// Dashboard layout with sidebar and header

import { requireTenant } from '@/lib/auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, tenantId, tenantCode } = await requireTenant();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar tenantCode={tenantCode} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={session.user} tenant={session.tenant!} />
        
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
