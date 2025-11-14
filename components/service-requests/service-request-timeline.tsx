'use client';

interface ServiceRequestTimelineProps {
  serviceRequest: {
    id: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    steps?: Array<{
      id: number;
      title: string;
      status: string;
      createdAt?: Date;
      updatedAt?: Date;
    }>;
  };
}

export function ServiceRequestTimeline({ serviceRequest }: ServiceRequestTimelineProps) {
  // Build timeline events from service request data
  const timelineEvents = [
    {
      id: 'created',
      title: 'Service Request Created',
      description: `Request #${serviceRequest.id} was created`,
      timestamp: new Date(serviceRequest.createdAt),
      type: 'created',
      icon: '●',
      color: 'text-teal-600 bg-teal-100',
    },
    // Add step events if they exist
    ...(serviceRequest.steps?.map((step) => ({
      id: `step-${step.id}`,
      title: step.status === 'done' ? 'Step Completed' : 'Step Updated',
      description: `${step.title} - ${step.status.replace(/_/g, ' ')}`,
      timestamp: new Date(step.updatedAt || step.createdAt || serviceRequest.createdAt),
      type: step.status,
      icon: step.status === 'done' ? '✓' : step.status === 'blocked' ? '!' : '○',
      color:
        step.status === 'done' ? 'text-green-600 bg-green-100' :
        step.status === 'blocked' ? 'text-red-600 bg-red-100' :
        step.status === 'in_progress' ? 'text-yellow-600 bg-yellow-100' :
        'text-gray-600 bg-gray-100',
    })) || []),
  ];

  // Add current status event if different from created
  if (serviceRequest.status !== 'new') {
    const statusLabels: Record<string, string> = {
      in_progress: 'In Progress',
      awaiting_client: 'Awaiting Client Response',
      awaiting_authority: 'Awaiting Authority Response',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    const statusColors: Record<string, string> = {
      in_progress: 'text-yellow-600 bg-yellow-100',
      awaiting_client: 'text-purple-600 bg-purple-100',
      awaiting_authority: 'text-orange-600 bg-orange-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-gray-600 bg-gray-100',
    };

    const statusIcons: Record<string, string> = {
      in_progress: '◐',
      awaiting_client: '⏱',
      awaiting_authority: '⏱',
      completed: '✓',
      cancelled: '✕',
    };

    timelineEvents.push({
      id: 'status-changed',
      title: 'Status Changed',
      description: `Status updated to ${statusLabels[serviceRequest.status] || serviceRequest.status}`,
      timestamp: new Date(serviceRequest.updatedAt),
      type: serviceRequest.status,
      icon: statusIcons[serviceRequest.status] || '●',
      color: statusColors[serviceRequest.status] || 'text-blue-600 bg-blue-100',
    });
  }

  // Sort events by timestamp (most recent first)
  const sortedEvents = timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flow-root">
      {sortedEvents.length === 0 ? (
        <p className="text-sm text-gray-500">No timeline events yet</p>
      ) : (
        <ul className="-mb-8">
          {sortedEvents.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== sortedEvents.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.color}`}
                    >
                      <span className="text-sm font-bold">{event.icon}</span>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{event.description}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={event.timestamp.toISOString()}>
                        {event.timestamp.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        <br />
                        <span className="text-xs text-gray-400">
                          {event.timestamp.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
