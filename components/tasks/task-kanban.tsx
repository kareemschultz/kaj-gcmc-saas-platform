'use client';

import Link from 'next/link';
import { format } from 'date-fns';

interface TaskKanbanProps {
  tasks: any[];
}

const statusColumns = [
  { id: 'open', label: 'Open', color: 'bg-gray-100 border-gray-300' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-50 border-red-300' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50 border-green-300' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export function TaskKanban({ tasks }: TaskKanbanProps) {
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statusColumns.map((column) => (
        <div key={column.id} className="flex flex-col">
          <div className={`rounded-t-lg border-2 ${column.color} p-3`}>
            <h3 className="font-semibold text-gray-900">
              {column.label}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({tasksByStatus[column.id].length})
              </span>
            </h3>
          </div>
          <div className="flex-1 space-y-3 rounded-b-lg border-x-2 border-b-2 border-gray-200 bg-white p-3">
            {tasksByStatus[column.id].length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                No tasks
              </div>
            ) : (
              tasksByStatus[column.id].map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block"
                >
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-teal-500 hover:shadow-md">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 line-clamp-2">
                        {task.title}
                      </h4>
                      {task.priority && (
                        <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full capitalize ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs text-gray-500">
                      {task.assignedTo && (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-medium">
                            {task.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}

                      {task.client && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{task.client.name}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
