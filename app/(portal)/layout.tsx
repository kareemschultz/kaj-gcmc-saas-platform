import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalHeader } from '@/components/portal/portal-header';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PortalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
