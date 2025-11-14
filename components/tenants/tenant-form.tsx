'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTenant,
  updateTenant,
  deleteTenant,
  type TenantFormData,
} from '@/src/lib/actions/tenants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TenantFormProps {
  tenant?: {
    id: number;
    name: string;
    code: string;
    contactInfo: any;
    settings: any;
    _count?: {
      tenantUsers: number;
      clients: number;
      documents: number;
      filings: number;
      serviceRequests: number;
    };
  };
}

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export function TenantForm({ tenant }: TenantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TenantFormData>({
    name: tenant?.name || '',
    code: tenant?.code || '',
    contactInfo: {
      email: tenant?.contactInfo?.email || undefined,
      phone: tenant?.contactInfo?.phone || undefined,
      address: tenant?.contactInfo?.address || undefined,
    },
    settings: {
      branding: {
        logoUrl: tenant?.settings?.branding?.logoUrl || undefined,
        primaryColor: tenant?.settings?.branding?.primaryColor || undefined,
        secondaryColor: tenant?.settings?.branding?.secondaryColor || undefined,
      },
      defaults: {
        currency: tenant?.settings?.defaults?.currency || 'GYD',
        timezone: tenant?.settings?.defaults?.timezone || 'America/Guyana',
        dateFormat: tenant?.settings?.defaults?.dateFormat || 'MM/DD/YYYY',
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (tenant) {
          await updateTenant(tenant.id, formData);
        } else {
          await createTenant(formData);
        }
        router.push('/admin/tenants');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!tenant) return;
    if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteTenant(tenant.id);
        router.push('/admin/tenants');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete tenant');
      }
    });
  };

  const updateContactInfo = (field: string, value: string | undefined) => {
    setFormData({
      ...formData,
      contactInfo: {
        ...formData.contactInfo,
        [field]: value || undefined,
      },
    });
  };

  const updateBranding = (field: string, value: string | undefined) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        branding: {
          ...formData.settings.branding,
          [field]: value || undefined,
        },
      },
    });
  };

  const updateDefaults = (field: string, value: string) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        defaults: {
          ...formData.settings.defaults,
          [field]: value,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Acme Corporation"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
              setFormData({ ...formData, code: value });
            }}
            placeholder="e.g., acme-corp"
            required
            disabled={isPending || !!tenant}
            pattern="[a-z0-9-]+"
            title="Only lowercase letters, numbers, and hyphens allowed"
          />
          {tenant && (
            <p className="mt-1 text-xs text-gray-500">Code cannot be changed after creation</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.contactInfo.email || ''}
            onChange={(e) => updateContactInfo('email', e.target.value || undefined)}
            placeholder="contact@example.com"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.contactInfo.phone || ''}
            onChange={(e) => updateContactInfo('phone', e.target.value || undefined)}
            placeholder="+592 XXX XXXX"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.contactInfo.address || ''}
            onChange={(e) => updateContactInfo('address', e.target.value || undefined)}
            placeholder="Enter physical address"
            rows={3}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Branding */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900">Branding</h3>

        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={formData.settings.branding.logoUrl || ''}
            onChange={(e) => updateBranding('logoUrl', e.target.value || undefined)}
            placeholder="https://example.com/logo.png"
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.settings.branding.primaryColor || '#0d9488'}
                onChange={(e) => updateBranding('primaryColor', e.target.value || undefined)}
                disabled={isPending}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.settings.branding.primaryColor || ''}
                onChange={(e) => updateBranding('primaryColor', e.target.value || undefined)}
                placeholder="#0d9488"
                disabled={isPending}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={formData.settings.branding.secondaryColor || '#14b8a6'}
                onChange={(e) => updateBranding('secondaryColor', e.target.value || undefined)}
                disabled={isPending}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.settings.branding.secondaryColor || ''}
                onChange={(e) => updateBranding('secondaryColor', e.target.value || undefined)}
                placeholder="#14b8a6"
                disabled={isPending}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Default Settings */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900">Default Settings</h3>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.settings.defaults.currency}
            onChange={(e) => updateDefaults('currency', e.target.value)}
            placeholder="GYD"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={formData.settings.defaults.timezone}
            onChange={(e) => updateDefaults('timezone', e.target.value)}
            placeholder="America/Guyana"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select
            value={formData.settings.defaults.dateFormat}
            onValueChange={(value) => updateDefaults('dateFormat', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {tenant && tenant._count &&
           tenant._count.tenantUsers === 0 &&
           tenant._count.clients === 0 &&
           tenant._count.documents === 0 &&
           tenant._count.filings === 0 &&
           tenant._count.serviceRequests === 0 && (
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
            {isPending ? 'Saving...' : tenant ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
