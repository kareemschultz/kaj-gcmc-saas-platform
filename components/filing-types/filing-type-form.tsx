'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createFilingType,
  updateFilingType,
  deleteFilingType,
  type FilingTypeFormData,
} from '@/lib/actions/filing-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilingTypeFormProps {
  filingType?: {
    id: number;
    name: string;
    code: string;
    authority: string;
    frequency: string;
    defaultDueDay: number | null;
    defaultDueMonth: number | null;
    description: string | null;
    _count?: { filings: number };
  };
}

const AUTHORITIES = [
  { value: 'GRA', label: 'GRA' },
  { value: 'NIS', label: 'NIS' },
  { value: 'DCRA', label: 'DCRA' },
  { value: 'Immigration', label: 'Immigration' },
  { value: 'Deeds Registry', label: 'Deeds Registry' },
  { value: 'Go-Invest', label: 'Go-Invest' },
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'one_off', label: 'One-Off' },
];

export function FilingTypeForm({ filingType }: FilingTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FilingTypeFormData>({
    name: filingType?.name || '',
    code: filingType?.code || '',
    authority: filingType?.authority || '',
    frequency: filingType?.frequency || '',
    defaultDueDay: filingType?.defaultDueDay || undefined,
    defaultDueMonth: filingType?.defaultDueMonth || undefined,
    description: filingType?.description || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate defaultDueDay
    if (formData.defaultDueDay !== undefined && (formData.defaultDueDay < 1 || formData.defaultDueDay > 31)) {
      setError('Default due day must be between 1 and 31');
      return;
    }

    // Validate defaultDueMonth
    if (formData.defaultDueMonth !== undefined && (formData.defaultDueMonth < 1 || formData.defaultDueMonth > 12)) {
      setError('Default due month must be between 1 and 12');
      return;
    }

    startTransition(async () => {
      try {
        if (filingType) {
          await updateFilingType(filingType.id, formData);
        } else {
          await createFilingType(formData);
        }
        router.push('/filing-types');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!filingType) return;
    if (!confirm(`Are you sure you want to delete "${filingType.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteFilingType(filingType.id);
        router.push('/filing-types');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete filing type');
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
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Monthly VAT Return"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., GRA-VAT-M"
            required
            disabled={isPending}
            className="font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">Code will be converted to uppercase</p>
        </div>

        <div>
          <Label htmlFor="authority">Authority *</Label>
          <Select
            value={formData.authority}
            onValueChange={(value) => setFormData({ ...formData, authority: value })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an authority" />
            </SelectTrigger>
            <SelectContent>
              {AUTHORITIES.map((auth) => (
                <SelectItem key={auth.value} value={auth.value}>
                  {auth.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultDueDay">Default Due Day</Label>
            <Input
              id="defaultDueDay"
              type="number"
              min="1"
              max="31"
              value={formData.defaultDueDay || ''}
              onChange={(e) => setFormData({
                ...formData,
                defaultDueDay: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="1-31"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">Day of month (1-31)</p>
          </div>

          <div>
            <Label htmlFor="defaultDueMonth">Default Due Month</Label>
            <Input
              id="defaultDueMonth"
              type="number"
              min="1"
              max="12"
              value={formData.defaultDueMonth || ''}
              onChange={(e) => setFormData({
                ...formData,
                defaultDueMonth: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="1-12"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">Month of year (1-12)</p>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
            placeholder="Optional description"
            rows={3}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {filingType && filingType._count && filingType._count.filings === 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
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
            {isPending ? 'Saving...' : filingType ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
