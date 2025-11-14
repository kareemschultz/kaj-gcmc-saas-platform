import { notFound, redirect } from 'next/navigation';
import { getTask, deleteTask } from '@/lib/actions/tasks';
import { auth } from '@/auth';
import { TaskForm } from '@/components/tasks/task-form';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

async function DeleteTaskButton({ taskId }: { taskId: number }) {
  async function handleDelete() {
    'use server';
    await deleteTask(taskId);
    redirect('/tasks');
  }

  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete Task
      </button>
    </form>
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const { id } = await params;
  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    notFound();
  }

  let task;
  try {
    task = await getTask(taskId);
  } catch (error) {
    notFound();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and edit task information
            </p>
          </div>
        </div>
        {/* @ts-expect-error Async Server Component */}
        <DeleteTaskButton taskId={task.id} />
      </div>

      {/* Task Overview Card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            {task.description && (
              <p className="mt-2 text-gray-600">{task.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}>
              {statusLabels[task.status as keyof typeof statusLabels]}
            </span>
            {task.priority && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                {task.priority} Priority
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
            <div>
              <div className="text-sm font-medium text-gray-500">Assigned To</div>
              <div className="mt-1">
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-medium">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.assignedTo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.assignedTo.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Client</div>
              <div className="mt-1">
                {task.client ? (
                  <Link
                    href={`/clients/${task.client.id}`}
                    className="text-sm font-medium text-teal-600 hover:text-teal-900"
                  >
                    {task.client.name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">No client</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Due Date</div>
              <div className="mt-1">
                {task.dueDate ? (
                  <div className={`text-sm font-medium ${
                    new Date(task.dueDate) < new Date() && task.status !== 'completed'
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}>
                    {format(new Date(task.dueDate), 'MMM d, yyyy h:mm a')}
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <span className="ml-2 text-xs">(Overdue)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No due date</span>
                )}
              </div>
            </div>

            {task.serviceRequest && (
              <div>
                <div className="text-sm font-medium text-gray-500">Service Request</div>
                <div className="mt-1">
                  <Link
                    href={`/service-requests/${task.serviceRequest.id}`}
                    className="text-sm font-medium text-teal-600 hover:text-teal-900"
                  >
                    {task.serviceRequest.service?.name || `Request #${task.serviceRequest.id}`}
                  </Link>
                </div>
              </div>
            )}

            {task.filing && (
              <div>
                <div className="text-sm font-medium text-gray-500">Filing</div>
                <div className="mt-1">
                  <Link
                    href={`/filings/${task.filing.id}`}
                    className="text-sm font-medium text-teal-600 hover:text-teal-900"
                  >
                    {task.filing.filingType?.name || `Filing #${task.filing.id}`}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Task</h3>
        {/* @ts-expect-error Prisma types mismatch with form types */}
        <TaskForm task={task} />
      </div>
    </div>
  );
}
