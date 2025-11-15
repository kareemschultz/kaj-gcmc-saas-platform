'use client';

// Filing create/edit form component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createFiling, updateFiling } from '@/lib/actions/filings';
import { filingSchema, type FilingFormData } from '@/lib/schemas/filings';
import { toast } from '@/hooks/use-toast';

interface FilingFormProps {
  filing?: any;
  filingTypes: Array<{ id: number; name: string; code: string; authority: string; frequency: string }>;
  clients: Array<{ id: number; name: string; type: string }>;
}

export function FilingForm({ filing, filingTypes, clients }: FilingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FilingFormData>({
    resolver: zodResolver(filingSchema),
    defaultValues: filing || {
      status: 'draft',
    },
  });

  const clientId = watch('clientId');
  const filingTypeId = watch('filingTypeId');
  const status = watch('status');

  const onSubmit = async (data: FilingFormData) => {
    setIsSubmitting(true);
    try {
      if (filing) {
        await updateFiling(filing.id, data);
        toast({
          title: 'Filing updated',
          description: 'Filing has been updated successfully.',
        });
      } else {
        await createFiling(data);
        toast({
          title: 'Filing created',
          description: 'New filing has been created successfully.',
        });
      }
      router.push('/dashboard/filings');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save filing.',
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
          <Label htmlFor="clientId">Client *</Label>
          <Select 
            value={clientId?.toString()} 
            onValueChange={(value) => setValue('clientId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name} ({client.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && (
            <p className="mt-1 text-sm text-destructive">{errors.clientId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="filingTypeId">Filing Type *</Label>
          <Select 
            value={filingTypeId?.toString()} 
            onValueChange={(value) => setValue('filingTypeId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select filing type" />
            </SelectTrigger>
            <SelectContent>
              {filingTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name} ({type.authority}) - {type.frequency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.filingTypeId && (
            <p className="mt-1 text-sm text-destructive">{errors.filingTypeId.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="periodStart">Period Start</Label>
            <Input
              id="periodStart"
              type="date"
              {...register('periodStart')}
            />
          </div>

          <div>
            <Label htmlFor="periodEnd">Period End</Label>
            <Input
              id="periodEnd"
              type="date"
              {...register('periodEnd')}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="periodLabel">Period Label</Label>
          <Input
            id="periodLabel"
            {...register('periodLabel')}
            placeholder="e.g. Q1 2024, January 2024"
          />
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="prepared">Prepared</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="mt-1 text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              {...register('referenceNumber')}
              placeholder="Filing reference"
            />
          </div>

          <div>
            <Label htmlFor="submissionDate">Submission Date</Label>
            <Input
              id="submissionDate"
              type="date"
              {...register('submissionDate')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="taxAmount">Tax Amount</Label>
            <Input
              id="taxAmount"
              type="number"
              step="0.01"
              {...register('taxAmount', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="penalties">Penalties</Label>
            <Input
              id="penalties"
              type="number"
              step="0.01"
              {...register('penalties', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="interest">Interest</Label>
            <Input
              id="interest"
              type="number"
              step="0.01"
              {...register('interest', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="internalNotes">Internal Notes</Label>
          <Textarea
            id="internalNotes"
            {...register('internalNotes')}
            placeholder="Add notes for internal use"
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : filing ? 'Update Filing' : 'Create Filing'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/filings')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
