'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Briefcase,
  MessageSquare,
  User,
  ListTodo,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { name: 'Documents', href: '/portal/documents', icon: FileText },
  { name: 'Filings', href: '/portal/filings', icon: FileCheck },
  { name: 'Service Requests', href: '/portal/services', icon: Briefcase },
  { name: 'Tasks', href: '/portal/tasks', icon: ListTodo },
  { name: 'Messages', href: '/portal/messages', icon: MessageSquare },
  { name: 'Profile', href: '/portal/profile', icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      {/* Logo/Branding */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <div className="font-semibold text-sm">KGC Compliance</div>
            <div className="text-xs text-muted-foreground">Client Portal</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          © 2024 KGC Compliance Cloud
        </div>
      </div>
    </aside>
  );
}
