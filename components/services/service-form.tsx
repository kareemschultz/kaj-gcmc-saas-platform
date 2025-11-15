'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createService,
  updateService,
  deleteService,
} from '@/lib/actions/services';
import { type ServiceFormData } from '@/lib/schemas/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ServiceFormProps {
  service?: {
    id: number;
    name: string;
    category: string;
    description: string | null;
    basePrice: number | null;
    estimatedDays: number | null;
    active: boolean;
    _count?: { serviceRequests: number; templates: number };
  };
}

const CATEGORIES = [
  { value: 'Tax Compliance', label: 'Tax Compliance' },
  { value: 'Business Registration', label: 'Business Registration' },
  { value: 'Immigration Services', label: 'Immigration Services' },
  { value: 'Legal Services', label: 'Legal Services' },
  { value: 'Property Services', label: 'Property Services' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Advisory', label: 'Advisory' },
  { value: 'Other', label: 'Other' },
];

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: service?.name || '',
    category: service?.category || '',
    description: service?.description || undefined,
    basePrice: service?.basePrice || undefined,
    estimatedDays: service?.estimatedDays || undefined,
    active: service?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate basePrice
    if (formData.basePrice !== undefined && formData.basePrice < 0) {
      setError('Base price must be 0 or greater');
      return;
    }

    // Validate estimatedDays
    if (formData.estimatedDays !== undefined && formData.estimatedDays < 1) {
      setError('Estimated days must be at least 1');
      return;
    }

    startTransition(async () => {
      try {
        if (service) {
          await updateService(service.id, formData);
        } else {
          await createService(formData);
        }
        router.push('/services');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteService(service.id);
        router.push('/services');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete service');
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
            placeholder="e.g., Annual Tax Return Preparation"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
            placeholder="Optional description of the service"
            rows={3}
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="basePrice">Base Price</Label>
            <Input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.basePrice || ''}
              onChange={(e) => setFormData({
                ...formData,
                basePrice: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              placeholder="0.00"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">Optional base price for this service</p>
          </div>

          <div>
            <Label htmlFor="estimatedDays">Estimated Days</Label>
            <Input
              id="estimatedDays"
              type="number"
              min="1"
              value={formData.estimatedDays || ''}
              onChange={(e) => setFormData({
                ...formData,
                estimatedDays: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="e.g., 5"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">Estimated completion time in days</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
            disabled={isPending}
          />
          <Label
            htmlFor="active"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Active
          </Label>
          <p className="text-xs text-gray-500">Service is available for clients</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {service && service._count && service._count.serviceRequests === 0 && service._count.templates === 0 && (
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
            {isPending ? 'Saving...' : service ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
