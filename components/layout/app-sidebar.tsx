'use client';

// Application sidebar navigation

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, FolderOpen, Briefcase, CheckCircle, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  tenantCode: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Filings', href: '/dashboard/filings', icon: FolderOpen },
  { name: 'Services', href: '/dashboard/services', icon: Briefcase },
  { name: 'Compliance', href: '/dashboard/compliance', icon: CheckCircle },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function AppSidebar({ tenantCode }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">KGC Cloud</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
            <span className="font-medium text-primary">{tenantCode}</span>
          </div>
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          v0.1.0 - Phase 0
        </div>
      </div>
    </aside>
  );
}
