'use client';

// Client create/edit form component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient, updateClient, clientSchema, type ClientFormData } from '@/lib/actions/clients';
import { toast } from '@/hooks/use-toast';
import type { Client } from '@prisma/client';

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: (client as any) || {
      type: 'individual',
    },
  });

  const type = watch('type');
  const riskLevel = watch('riskLevel');

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      if (client) {
        await updateClient(client.id, data);
        toast({
          title: 'Client updated',
          description: 'Client has been updated successfully.',
        });
      } else {
        await createClient(data);
        toast({
          title: 'Client created',
          description: 'New client has been created successfully.',
        });
      }
      router.push('/dashboard/clients');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save client.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Client Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter client name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Client Type *</Label>
          <Select value={type} onValueChange={(value) => setValue('type', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="mt-1 text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="client@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+592 xxx xxxx"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...register('address')}
            placeholder="Enter physical address"
            rows={3}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tin">TIN</Label>
            <Input
              id="tin"
              {...register('tin')}
              placeholder="Tax Identification Number"
            />
            {errors.tin && (
              <p className="mt-1 text-sm text-destructive">{errors.tin.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nisNumber">NIS Number</Label>
            <Input
              id="nisNumber"
              {...register('nisNumber')}
              placeholder="National Insurance Number"
            />
            {errors.nisNumber && (
              <p className="mt-1 text-sm text-destructive">{errors.nisNumber.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              {...register('sector')}
              placeholder="e.g. Finance, Legal, Real Estate"
            />
            {errors.sector && (
              <p className="mt-1 text-sm text-destructive">{errors.sector.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select value={riskLevel || ''} onValueChange={(value) => setValue('riskLevel', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            {errors.riskLevel && (
              <p className="mt-1 text-sm text-destructive">{errors.riskLevel.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Additional notes about this client"
            rows={4}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/clients')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
