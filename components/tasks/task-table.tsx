'use client';

import Link from 'next/link';
import { format } from 'date-fns';

interface TaskTableProps {
  tasks: any[];
}

const statusColors = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export function TaskTable({ tasks }: TaskTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  No tasks found. <Link href="/tasks/new" className="text-teal-600 hover:text-teal-900">Create your first task</Link>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}>
                      {statusLabels[task.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.priority ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-medium text-sm">
                          {task.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-900">
                          {task.assignedTo.name}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {task.client ? task.client.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.dueDate ? (
                      <div className="text-sm">
                        <div className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(task.dueDate), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-teal-600 hover:text-teal-900 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
