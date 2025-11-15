import { ServiceRequestForm } from '@/components/service-requests/service-request-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServices } from '@/lib/actions/services';
import { prisma } from '@/lib/prisma';

export default async function NewServiceRequestPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch clients with businesses and services for the form
  const [clients, { services }] = await Promise.all([
    prisma.client.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 1000,
    }),
    getServices({ pageSize: 1000, active: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Service Request</h1>
          <p className="mt-1 text-sm text-gray-600">
            Start a new service request for a client
          </p>
        </div>
        <Link
          href="/services/requests"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Service Requests
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ServiceRequestForm clients={clients} services={services} />
      </div>
    </div>
  );
}
