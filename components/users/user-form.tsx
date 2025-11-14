'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUser,
  updateUser,
  deleteUser,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/src/lib/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFormProps {
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    tenantUsers: Array<{
      roleId: number;
      role: {
        id: number;
        name: string;
      };
    }>;
  };
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
}

export function UserForm({ user, roles }: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: user?.phone || '',
    roleId: user?.tenantUsers[0]?.roleId || '',
    avatarUrl: user?.avatarUrl || '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (user) {
          // Update user
          const updateData: UpdateUserFormData = {};
          if (formData.email !== user.email) updateData.email = formData.email;
          if (formData.name !== user.name) updateData.name = formData.name;
          if (formData.phone !== user.phone) updateData.phone = formData.phone || undefined;
          if (formData.avatarUrl !== user.avatarUrl) updateData.avatarUrl = formData.avatarUrl || '';
          if (formData.roleId && parseInt(formData.roleId as string) !== user.tenantUsers[0]?.roleId) {
            updateData.roleId = parseInt(formData.roleId as string);
          }

          await updateUser(user.id, updateData);
        } else {
          // Create user
          if (!formData.password) {
            setError('Password is required for new users');
            return;
          }
          if (!formData.roleId) {
            setError('Role is required');
            return;
          }

          const createData: CreateUserFormData = {
            email: formData.email,
            name: formData.name,
            phone: formData.phone || undefined,
            roleId: parseInt(formData.roleId as string),
            password: formData.password,
          };

          await createUser(createData);
        }
        router.push('/admin/users');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteUser(user.id);
        router.push('/admin/users');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete user');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+233 XX XXX XXXX"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.roleId.toString()}
            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                  {role.description && (
                    <span className="text-xs text-gray-500 ml-2">
                      - {role.description}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!user && (
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              required={!user}
              minLength={8}
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters long
            </p>
          </div>
        )}

        {user && (
          <div>
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              disabled={isPending}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {user && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete User
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </div>
    </form>
  );
}
