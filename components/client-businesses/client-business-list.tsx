'use client';

// Client Businesses list component

import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { ClientBusinessForm } from './client-business-form';
import { deleteClientBusiness } from '@/src/lib/actions/client-businesses';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { ClientBusiness } from '@prisma/client';

interface ClientBusinessListProps {
  clientId: number;
  businesses: ClientBusiness[];
}

export function ClientBusinessList({ clientId, businesses }: ClientBusinessListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<ClientBusiness | undefined>();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (business: ClientBusiness) => {
    setEditingBusiness(business);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this business?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteClientBusiness(id);
      toast({
        title: 'Business deleted',
        description: 'Business has been deleted successfully.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete business.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingBusiness(undefined);
    router.refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBusiness(undefined);
  };

  const handleAddNew = () => {
    setEditingBusiness(undefined);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Businesses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage businesses associated with this client
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={handleAddNew}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader>
            <CardTitle>
              {editingBusiness ? 'Edit Business' : 'New Business'}
            </CardTitle>
            <CardDescription>
              {editingBusiness
                ? 'Update business information'
                : 'Add a new business for this client'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientBusinessForm
              clientId={clientId}
              business={editingBusiness}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {businesses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No businesses yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding a business for this client
            </p>
            <Button
              onClick={handleAddNew}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {businesses.map((business) => (
            <Card key={business.id} className="hover:border-teal-200 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  {business.name}
                </CardTitle>
                <CardDescription>
                  {business.registrationType && (
                    <span>{business.registrationType}</span>
                  )}
                  {business.registrationNumber && (
                    <span className="ml-2">• Reg #: {business.registrationNumber}</span>
                  )}
                </CardDescription>
                <CardAction>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(business)}
                      disabled={showForm}
                      className="hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(business.id)}
                      disabled={deletingId === business.id}
                      className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  {business.status && (
                    <div>
                      <span className="font-medium text-muted-foreground">Status:</span>{' '}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          business.status === 'Active'
                            ? 'bg-teal-100 text-teal-800'
                            : business.status === 'Inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : business.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {business.status}
                      </span>
                    </div>
                  )}
                  {business.incorporationDate && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Incorporated:
                      </span>{' '}
                      {new Date(business.incorporationDate).toLocaleDateString()}
                    </div>
                  )}
                  {business.country && (
                    <div>
                      <span className="font-medium text-muted-foreground">Country:</span>{' '}
                      {business.country}
                    </div>
                  )}
                  {business.sector && (
                    <div>
                      <span className="font-medium text-muted-foreground">Sector:</span>{' '}
                      {business.sector}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
