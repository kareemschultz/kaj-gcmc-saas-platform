'use client';

// Document create/edit form component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDocument, updateDocument, documentSchema, type DocumentFormData } from '@/lib/actions/documents';
import { toast } from '@/hooks/use-toast';

interface DocumentFormProps {
  document?: any;
  documentTypes: Array<{ id: number; name: string; category: string }>;
  clients: Array<{ id: number; name: string; type: string }>;
}

export function DocumentForm({ document, documentTypes, clients }: DocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: document || {
      status: 'pending_review',
      tags: [],
    },
  });

  const clientId = watch('clientId');
  const documentTypeId = watch('documentTypeId');
  const status = watch('status');

  const onSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      if (document) {
        await updateDocument(document.id, data);
        toast({
          title: 'Document updated',
          description: 'Document has been updated successfully.',
        });
      } else {
        await createDocument(data);
        toast({
          title: 'Document created',
          description: 'New document has been created successfully.',
        });
      }
      router.push('/dashboard/documents');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save document.',
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
          <Label htmlFor="title">Document Title *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter document title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

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
          <Label htmlFor="documentTypeId">Document Type *</Label>
          <Select 
            value={documentTypeId?.toString()} 
            onValueChange={(value) => setValue('documentTypeId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name} ({type.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.documentTypeId && (
            <p className="mt-1 text-sm text-destructive">{errors.documentTypeId.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="authority">Authority</Label>
            <Select 
              value={watch('authority') || ''} 
              onValueChange={(value) => setValue('authority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="GRA">GRA</SelectItem>
                <SelectItem value="NIS">NIS</SelectItem>
                <SelectItem value="DCRA">DCRA</SelectItem>
                <SelectItem value="Immigration">Immigration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter document description"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : document ? 'Update Document' : 'Create Document'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/documents')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
