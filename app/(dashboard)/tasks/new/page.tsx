import { TaskForm } from '@/components/tasks/task-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/tasks"
          className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Task</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new task and assign it to a team member
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <TaskForm />
        </div>
      </div>
    </div>
  );
}
