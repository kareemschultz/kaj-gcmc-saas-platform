import Link from 'next/link';
import { getTasks } from '@/lib/actions/tasks';
import { getUsers } from '@/lib/actions/users';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TaskKanban } from '@/components/tasks/task-kanban';
import { TaskTable } from '@/components/tasks/task-table';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    view?: string;
  }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const view = params.view || 'kanban';

  const { tasks, total, totalPages } = await getTasks({
    page,
    pageSize: view === 'kanban' ? 100 : 20,
    search: params.search,
    status: params.status,
    priority: params.priority,
    assignedToId: params.assignedToId ? parseInt(params.assignedToId) : undefined,
  });

  // Get users for filter dropdown
  const { users } = await getUsers({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track tasks across your organization
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Add Task
        </Link>
      </div>

      {/* Filters and View Toggle */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="space-y-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="text-sm font-medium text-gray-700">View Mode</div>
            <div className="flex gap-2">
              <Link
                href={`/tasks?view=kanban${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === 'kanban'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Kanban
              </Link>
              <Link
                href={`/tasks?view=table${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === 'table'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Table
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <form action="/tasks" method="get">
                <input type="hidden" name="view" value={view} />
                {params.status && <input type="hidden" name="status" value={params.status} />}
                {params.priority && <input type="hidden" name="priority" value={params.priority} />}
                {params.assignedToId && <input type="hidden" name="assignedToId" value={params.assignedToId} />}
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search || ''}
                  placeholder="Search tasks..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </form>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <form action="/tasks" method="get">
                <input type="hidden" name="view" value={view} />
                {params.search && <input type="hidden" name="search" value={params.search} />}
                {params.priority && <input type="hidden" name="priority" value={params.priority} />}
                {params.assignedToId && <input type="hidden" name="assignedToId" value={params.assignedToId} />}
                <select
                  name="status"
                  defaultValue={params.status || ''}
                  onChange={(e) => e.currentTarget.form?.submit()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </form>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <form action="/tasks" method="get">
                <input type="hidden" name="view" value={view} />
                {params.search && <input type="hidden" name="search" value={params.search} />}
                {params.status && <input type="hidden" name="status" value={params.status} />}
                {params.assignedToId && <input type="hidden" name="assignedToId" value={params.assignedToId} />}
                <select
                  name="priority"
                  defaultValue={params.priority || ''}
                  onChange={(e) => e.currentTarget.form?.submit()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </form>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <form action="/tasks" method="get">
                <input type="hidden" name="view" value={view} />
                {params.search && <input type="hidden" name="search" value={params.search} />}
                {params.status && <input type="hidden" name="status" value={params.status} />}
                {params.priority && <input type="hidden" name="priority" value={params.priority} />}
                <select
                  name="assignedToId"
                  defaultValue={params.assignedToId || ''}
                  onChange={(e) => e.currentTarget.form?.submit()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Users</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </form>
            </div>
          </div>

          {/* Active Filters */}
          {(params.search || params.status || params.priority || params.assignedToId) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {params.search && (
                <Link
                  href={`/tasks?view=${view}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-800"
                >
                  Search: {params.search}
                  <span className="text-teal-600">×</span>
                </Link>
              )}
              {params.status && (
                <Link
                  href={`/tasks?view=${view}${params.search ? `&search=${params.search}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-800"
                >
                  Status: {params.status}
                  <span className="text-teal-600">×</span>
                </Link>
              )}
              {params.priority && (
                <Link
                  href={`/tasks?view=${view}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-800"
                >
                  Priority: {params.priority}
                  <span className="text-teal-600">×</span>
                </Link>
              )}
              {params.assignedToId && (
                <Link
                  href={`/tasks?view=${view}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-800"
                >
                  User: {users.find((u: any) => u.id === parseInt(params.assignedToId!))?.name}
                  <span className="text-teal-600">×</span>
                </Link>
              )}
              <Link
                href={`/tasks?view=${view}`}
                className="text-sm text-teal-600 hover:text-teal-900"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Display */}
      {view === 'kanban' ? (
        <TaskKanban tasks={tasks} />
      ) : (
        <>
          <TaskTable tasks={tasks} />

          {/* Pagination */}
          {view === 'table' && totalPages > 1 && (
            <div className="bg-white rounded-lg border px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/tasks?view=${view}&page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'
                  } bg-white text-gray-700`}
                >
                  Previous
                </Link>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p: any) => (
                  <Link
                    key={p}
                    href={`/tasks?view=${view}&page=${p}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      p === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={`/tasks?view=${view}&page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}${params.priority ? `&priority=${params.priority}` : ''}${params.assignedToId ? `&assignedToId=${params.assignedToId}` : ''}`}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'
                  } bg-white text-gray-700`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
