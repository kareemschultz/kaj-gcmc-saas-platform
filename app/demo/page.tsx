// Demo preview page to showcase the UI without auth

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Users, FolderOpen, Briefcase } from 'lucide-react';

export default function DemoPage() {
  const stats = [
    { name: 'Total Clients', value: 24, icon: Users, color: 'text-blue-600' },
    { name: 'Documents', value: 156, icon: FileText, color: 'text-green-600' },
    { name: 'Filings', value: 89, icon: FolderOpen, color: 'text-purple-600' },
    { name: 'Services', value: 12, icon: Briefcase, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0f766e]">KGC Compliance Cloud</h1>
              <p className="text-sm text-gray-600">Multi-tenant Compliance Platform</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Documentation</Button>
              <Link href="/auth/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to KGC Compliance Cloud</h2>
          <p className="text-gray-600">
            A comprehensive multi-tenant SaaS platform for managing compliance, filings, and documents for professional services firms in Guyana.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat: any) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Client Management</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage individual, company, and partnership clients with comprehensive profiles, risk levels, and compliance tracking.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Multi-type client support</li>
              <li>• Risk level assessment</li>
              <li>• TIN/NIS tracking</li>
              <li>• Business relationships</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Document Management</h3>
            <p className="text-gray-600 text-sm mb-4">
              Store and manage documents with versioning, expiry tracking, and integration with MinIO object storage.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Version control</li>
              <li>• Expiry date tracking</li>
              <li>• MinIO storage integration</li>
              <li>• Authority categorization</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Filings & Compliance</h3>
            <p className="text-gray-600 text-sm mb-4">
              Track filings for GRA, NIS, DCRA, and Immigration with automated calculations and document attachments.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Multi-authority support</li>
              <li>• Tax calculations</li>
              <li>• Deadline tracking</li>
              <li>• Document linking</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100">
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Service Requests</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage service requests with SLA tracking, assignments, and progress monitoring for client work.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• SLA management</li>
              <li>• Team assignments</li>
              <li>• Priority tracking</li>
              <li>• Status workflows</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Tenant Security</h3>
            <p className="text-gray-600 text-sm mb-4">
              Row-level security with tenant isolation, role-based access control, and comprehensive audit logging.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Tenant isolation</li>
              <li>• 8 role types</li>
              <li>• Audit logging</li>
              <li>• Permission system</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Reports & Analytics</h3>
            <p className="text-gray-600 text-sm mb-4">
              Generate compliance reports, track deadlines, and analyze performance across all authorities and clients.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Custom reports</li>
              <li>• Deadline dashboards</li>
              <li>• Performance metrics</li>
              <li>• Export capabilities</li>
            </ul>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="mt-12 p-8 bg-white rounded-lg border">
          <h3 className="text-2xl font-bold mb-4">Technology Stack</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="font-semibold mb-2 text-[#0f766e]">Frontend</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Next.js 16 (App Router)</li>
                <li>• React 19.2</li>
                <li>• Tailwind CSS v4</li>
                <li>• shadcn/ui Components</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#0f766e]">Backend</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Node.js</li>
                <li>• NextAuth v5</li>
                <li>• Prisma ORM</li>
                <li>• Server Actions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#0f766e]">Infrastructure</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• PostgreSQL (Neon)</li>
                <li>• Redis (Upstash)</li>
                <li>• MinIO Object Storage</li>
                <li>• Docker Compose</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#0f766e]">Features</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• BullMQ Job Queue</li>
                <li>• Multi-tenant Architecture</li>
                <li>• Role-based Access</li>
                <li>• Audit Logging</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
