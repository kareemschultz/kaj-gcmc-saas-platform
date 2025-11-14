'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  type ServiceRequestFormData,
} from '@/src/lib/actions/service-requests';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceRequestFormProps {
  serviceRequest?: {
    id: number;
    clientId: number;
    clientBusinessId: number | null;
    serviceId: number;
    status: string;
    priority: string | null;
    client?: {
      id: number;
      name: string;
      businesses?: Array<{ id: number; name: string }>;
    };
  };
  clients: Array<{
    id: number;
    name: string;
    type: string;
    businesses?: Array<{ id: number; name: string }>;
  }>;
  services: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}

export function ServiceRequestForm({ serviceRequest, clients, services }: ServiceRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ServiceRequestFormData>({
    clientId: serviceRequest?.clientId || 0,
    clientBusinessId: serviceRequest?.clientBusinessId || undefined,
    serviceId: serviceRequest?.serviceId || 0,
    status: (serviceRequest?.status || 'new') as any,
    priority: (serviceRequest?.priority || undefined) as any,
  });

  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(
    clients.find(c => c.id === formData.clientId) || null
  );

  // Update selected client when clientId changes
  useEffect(() => {
    const client = clients.find(c => c.id === formData.clientId);
    setSelectedClient(client || null);

    // Reset clientBusinessId if the selected client doesn't have the current business
    if (client && formData.clientBusinessId) {
      const hasCurrentBusiness = client.businesses?.some(b => b.id === formData.clientBusinessId);
      if (!hasCurrentBusiness) {
        setFormData(prev => ({ ...prev, clientBusinessId: undefined }));
      }
    }
  }, [formData.clientId, clients, formData.clientBusinessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.clientId || formData.clientId === 0) {
      setError('Please select a client');
      return;
    }

    if (!formData.serviceId || formData.serviceId === 0) {
      setError('Please select a service');
      return;
    }

    startTransition(async () => {
      try {
        if (serviceRequest) {
          await updateServiceRequest(serviceRequest.id, formData);
          router.refresh();
        } else {
          const newRequest = await createServiceRequest(formData);
          router.push(`/services/requests/${newRequest.id}`);
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!serviceRequest) return;
    if (!confirm('Are you sure you want to delete this service request?')) return;

    startTransition(async () => {
      try {
        await deleteServiceRequest(serviceRequest.id);
        router.push('/services/requests');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete service request');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="clientId">Client *</Label>
          <Select
            value={formData.clientId.toString()}
            onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
            disabled={isPending || !!serviceRequest}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name} ({client.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {serviceRequest && (
            <p className="text-xs text-gray-500 mt-1">Client cannot be changed after creation</p>
          )}
        </div>

        <div>
          <Label htmlFor="clientBusinessId">Client Business (Optional)</Label>
          <Select
            value={formData.clientBusinessId?.toString() || ''}
            onValueChange={(value) => setFormData({
              ...formData,
              clientBusinessId: value ? parseInt(value) : undefined
            })}
            disabled={isPending || !selectedClient || !selectedClient.businesses?.length}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedClient ? "Select a client first" :
                !selectedClient.businesses?.length ? "No businesses available" :
                "Select a business"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {selectedClient?.businesses?.map((business) => (
                <SelectItem key={business.id} value={business.id.toString()}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="serviceId">Service *</Label>
          <Select
            value={formData.serviceId.toString()}
            onValueChange={(value) => setFormData({ ...formData, serviceId: parseInt(value) })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id.toString()}>
                  {service.name} - {service.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_client">Awaiting Client</SelectItem>
              <SelectItem value="awaiting_authority">Awaiting Authority</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority || ''}
            onValueChange={(value) => setFormData({
              ...formData,
              priority: value ? value as any : undefined
            })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {serviceRequest && (
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
            {isPending ? 'Saving...' : serviceRequest ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
