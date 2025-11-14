import { getUser } from '@/lib/actions/users';
import { getRoles } from '@/lib/actions/roles';
import { UserForm } from '@/components/users/user-form';
import { PasswordResetForm } from '@/components/users/password-reset-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditUserPage({
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
    const [user, roles] = await Promise.all([
      getUser(id),
      getRoles(),
    ]);

    const isOwnProfile = session.user.id === id;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {user.name}'s details
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
          <UserForm user={user} roles={roles} />
        </div>

        {isOwnProfile && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Change Password</h2>
            <PasswordResetForm userId={id} />
          </div>
        )}

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">User Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.tenantUsers[0]?.role?.name || 'No Role'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Permissions</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.tenantUsers[0]?.role?.permissions?.length || 0} permissions
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
