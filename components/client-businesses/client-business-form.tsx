'use client';

// Client Business create/edit form component

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  createClientBusiness,
  updateClientBusiness,
  clientBusinessSchema,
  type ClientBusinessFormData,
} from '@/lib/actions/client-businesses';
import { toast } from '@/hooks/use-toast';
import type { ClientBusiness } from '@prisma/client';

interface ClientBusinessFormProps {
  clientId: number;
  business?: ClientBusiness;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientBusinessForm({
  clientId,
  business,
  onSuccess,
  onCancel,
}: ClientBusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientBusinessFormData>({
    resolver: zodResolver(clientBusinessSchema),
    defaultValues: (business as any)
      ? {
          ...(business as any),
          incorporationDate: (business as any).incorporationDate
            ? new Date(business.incorporationDate).toISOString().split('T')[0]
            : undefined,
          registrationType: business.registrationType as any,
          status: business.status as any,
        }
      : {
          clientId,
          country: 'Guyana',
        },
  });

  const registrationType = watch('registrationType');
  const status = watch('status');

  const onSubmit = async (data: ClientBusinessFormData) => {
    setIsSubmitting(true);
    try {
      if (business) {
        await updateClientBusiness(business.id, data);
        toast({
          title: 'Business updated',
          description: 'Business has been updated successfully.',
        });
      } else {
        await createClientBusiness(data);
        toast({
          title: 'Business created',
          description: 'New business has been created successfully.',
        });
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save business.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('clientId', { valueAsNumber: true })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter business name"
            className="focus-visible:ring-teal-600"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            {...register('registrationNumber')}
            placeholder="e.g. 123456"
            className="focus-visible:ring-teal-600"
          />
          {errors.registrationNumber && (
            <p className="mt-1 text-sm text-destructive">
              {errors.registrationNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="registrationType">Registration Type</Label>
          <Select
            value={registrationType || ''}
            onValueChange={(value) => setValue('registrationType', value as any)}
          >
            <SelectTrigger className="focus:ring-teal-600">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="Partnership">Partnership</SelectItem>
              <SelectItem value="LLC">LLC</SelectItem>
              <SelectItem value="Corporation">Corporation</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.registrationType && (
            <p className="mt-1 text-sm text-destructive">
              {errors.registrationType.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="incorporationDate">Incorporation Date</Label>
          <Input
            id="incorporationDate"
            type="date"
            {...register('incorporationDate')}
            className="focus-visible:ring-teal-600"
          />
          {errors.incorporationDate && (
            <p className="mt-1 text-sm text-destructive">
              {errors.incorporationDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Guyana"
            className="focus-visible:ring-teal-600"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sector">Sector</Label>
          <Input
            id="sector"
            {...register('sector')}
            placeholder="e.g. Finance, Manufacturing"
            className="focus-visible:ring-teal-600"
          />
          {errors.sector && (
            <p className="mt-1 text-sm text-destructive">{errors.sector.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={status || ''}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger className="focus:ring-teal-600">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Dissolved">Dissolved</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="mt-1 text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {isSubmitting ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
