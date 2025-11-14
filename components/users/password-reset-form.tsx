'use client';

import { useState, useTransition } from 'react';
import {
  changePassword,
  type ChangePasswordFormData,
} from '@/lib/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordResetFormProps {
  userId: number;
}

export function PasswordResetForm({ userId }: PasswordResetFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    startTransition(async () => {
      try {
        const data: ChangePasswordFormData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        };

        await changePassword(userId, data);

        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to change password');
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

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Password changed successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current Password *</Label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="newPassword">New Password *</Label>
          <Input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Changing Password...' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
}
