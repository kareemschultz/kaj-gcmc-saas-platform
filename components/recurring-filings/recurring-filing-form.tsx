'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createRecurringFiling,
  updateRecurringFiling,
  recurringFilingSchema,
  type RecurringFilingFormData,
} from '@/lib/actions/recurring-filings';
import { toast } from '@/hooks/use-toast';

interface RecurringFilingFormProps {
  recurringFiling?: any;
  filingTypes: Array<{ id: number; name: string; code: string; authority: string; frequency: string }>;
  clients: Array<{ id: number; name: string; type: string }>;
  clientBusinesses?: Array<{ id: number; name: string; clientId: number }>;
}

export function RecurringFilingForm({
  recurringFiling,
  filingTypes,
  clients,
  clientBusinesses = [],
}: RecurringFilingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBusinesses, setAvailableBusinesses] = useState<typeof clientBusinesses>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringFilingFormData>({
    resolver: zodResolver(recurringFilingSchema),
    defaultValues: recurringFiling
      ? {
          clientId: recurringFiling.clientId,
          clientBusinessId: recurringFiling.clientBusinessId || undefined,
          filingTypeId: recurringFiling.filingTypeId,
          schedule: recurringFiling.schedule,
          active: recurringFiling.active,
          nextRunAt: recurringFiling.nextRunAt
            ? new Date(recurringFiling.nextRunAt).toISOString().slice(0, 16)
            : undefined,
        }
      : {
          active: true,
          schedule: 'monthly',
        },
  });

  const clientId = watch('clientId');
  const filingTypeId = watch('filingTypeId');
  const schedule = watch('schedule');
  const active = watch('active');
  const clientBusinessId = watch('clientBusinessId');

  // Filter businesses based on selected client
  useEffect(() => {
    if (clientId) {
      const filtered = clientBusinesses.filter((b) => b.clientId === clientId);
      setAvailableBusinesses(filtered);

      // Reset business selection if it doesn't belong to the selected client
      if (clientBusinessId && !filtered.find((b) => b.id === clientBusinessId)) {
        setValue('clientBusinessId', undefined);
      }
    } else {
      setAvailableBusinesses([]);
      setValue('clientBusinessId', undefined);
    }
  }, [clientId, clientBusinesses, clientBusinessId, setValue]);

  const onSubmit = async (data: RecurringFilingFormData) => {
    setIsSubmitting(true);
    try {
      if (recurringFiling) {
        await updateRecurringFiling(recurringFiling.id, data);
        toast({
          title: 'Recurring filing updated',
          description: 'Recurring filing has been updated successfully.',
        });
      } else {
        await createRecurringFiling(data);
        toast({
          title: 'Recurring filing created',
          description: 'New recurring filing has been created successfully.',
        });
      }
      router.push('/filings/recurring');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save recurring filing.',
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
          <Select value={clientId?.toString()} onValueChange={(value) => setValue('clientId', parseInt(value))}>
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
          {errors.clientId && <p className="mt-1 text-sm text-destructive">{errors.clientId.message}</p>}
        </div>

        <div>
          <Label htmlFor="clientBusinessId">Client Business (Optional)</Label>
          <Select
            value={clientBusinessId?.toString() || ''}
            onValueChange={(value) => setValue('clientBusinessId', value ? parseInt(value) : undefined)}
            disabled={!clientId || availableBusinesses.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={availableBusinesses.length === 0 ? 'No businesses available' : 'Select business (optional)'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {availableBusinesses.map((business) => (
                <SelectItem key={business.id} value={business.id.toString()}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filingTypeId">Filing Type *</Label>
          <Select value={filingTypeId?.toString()} onValueChange={(value) => setValue('filingTypeId', parseInt(value))}>
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
          {errors.filingTypeId && <p className="mt-1 text-sm text-destructive">{errors.filingTypeId.message}</p>}
        </div>

        <div>
          <Label htmlFor="schedule">Schedule/Frequency *</Label>
          <Select value={schedule} onValueChange={(value) => setValue('schedule', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.schedule && <p className="mt-1 text-sm text-destructive">{errors.schedule.message}</p>}
        </div>

        <div>
          <Label htmlFor="nextRunAt">Next Run At (Optional)</Label>
          <Input id="nextRunAt" type="datetime-local" {...register('nextRunAt')} />
          {errors.nextRunAt && <p className="mt-1 text-sm text-destructive">{errors.nextRunAt.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked) => setValue('active', checked as boolean)}
          />
          <Label htmlFor="active" className="cursor-pointer font-normal">
            Active (automatically create filings)
          </Label>
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
          {isSubmitting ? 'Saving...' : recurringFiling ? 'Update Recurring Filing' : 'Create Recurring Filing'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/filings/recurring')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
