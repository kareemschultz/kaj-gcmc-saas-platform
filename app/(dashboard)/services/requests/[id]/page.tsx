import { getServiceRequest } from '@/lib/actions/service-requests';
import { getServices } from '@/lib/actions/services';
import { ServiceRequestForm } from '@/components/service-requests/service-request-form';
import { ServiceRequestWorkflow } from '@/components/service-requests/service-request-workflow';
import { ServiceRequestTimeline } from '@/components/service-requests/service-request-timeline';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  try {
    const [serviceRequest, clients, { services }] = await Promise.all([
      getServiceRequest(id),
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

    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      awaiting_client: 'bg-purple-100 text-purple-800',
      awaiting_authority: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    const priorityColors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Request #{serviceRequest.id}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {serviceRequest.client.name} - {serviceRequest.service.name}
            </p>
          </div>
          <Link
            href="/services/requests"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Service Requests
          </Link>
        </div>

        {/* Request Details Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
              <p className="text-sm text-gray-600 mt-1">Basic information about this service request</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[serviceRequest.status]}`}>
                {serviceRequest.status.replace(/_/g, ' ')}
              </span>
              {serviceRequest.priority && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${priorityColors[serviceRequest.priority]}`}>
                  {serviceRequest.priority}
                </span>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Client</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/clients/${serviceRequest.client.id}`} className="text-teal-600 hover:text-teal-900">
                  {serviceRequest.client.name}
                </Link>
                <div className="text-xs text-gray-500">{serviceRequest.client.email}</div>
              </dd>
            </div>

            {serviceRequest.clientBusiness && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Business</dt>
                <dd className="mt-1 text-sm text-gray-900">{serviceRequest.clientBusiness.name}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">Service</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {serviceRequest.service.name}
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                    {serviceRequest.service.category}
                  </span>
                </div>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(serviceRequest.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(serviceRequest.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>

            {serviceRequest.template && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Template</dt>
                <dd className="mt-1 text-sm text-gray-900">{serviceRequest.template.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Edit Form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Request</h2>
          <ServiceRequestForm
            serviceRequest={serviceRequest}
            clients={clients}
            services={services}
          />
        </div>

        {/* Workflow Steps */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Steps</h2>
          <ServiceRequestWorkflow
            serviceRequestId={serviceRequest.id}
            steps={serviceRequest.steps}
          />
        </div>

        {/* Linked Tasks */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
          {serviceRequest.tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {serviceRequest.tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    {task.assignedTo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned to: {task.assignedTo.name}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
          {serviceRequest.conversations.length === 0 ? (
            <p className="text-sm text-gray-500">No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {serviceRequest.conversations.map((conversation) => (
                <div key={conversation.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{conversation.subject}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversation._count.messages} messages
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
          <ServiceRequestTimeline serviceRequest={serviceRequest} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
