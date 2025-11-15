import { UserForm } from '@/components/users/user-form';
import { getRoles } from '@/lib/actions/roles';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewUserPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const roles = await getRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new user to your organization
          </p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Users
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <UserForm roles={roles} />
      </div>
    </div>
  );
}
