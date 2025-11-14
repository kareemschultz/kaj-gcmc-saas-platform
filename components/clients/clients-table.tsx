'use client';

// Clients table component with sorting and pagination

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import { deleteClient } from '@/src/lib/actions/clients';
import { toast } from '@/hooks/use-toast';
import type { Client } from '@prisma/client';

interface ClientWithCounts extends Client {
  _count: {
    documents: number;
    filings: number;
    serviceRequests: number;
  };
}

interface ClientsTableProps {
  clients: ClientWithCounts[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function ClientsTable({ clients, pagination }: ClientsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteClient(id);
      toast({
        title: 'Client deleted',
        description: `${name} has been deleted successfully.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getRiskBadgeColor = (risk?: string | null) => {
    if (!risk) return 'secondary';
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'company': return 'default';
      case 'individual': return 'secondary';
      case 'partnership': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>TIN/NIS</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Documents</TableHead>
            <TableHead className="text-right">Filings</TableHead>
            <TableHead className="text-right">Services</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No clients found. Create your first client to get started.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeColor(client.type)}>
                    {client.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {client.email && <div>{client.email}</div>}
                  {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                  {!client.email && !client.phone && <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">
                  {client.tin && <div>TIN: {client.tin}</div>}
                  {client.nisNumber && <div className="text-muted-foreground">NIS: {client.nisNumber}</div>}
                  {!client.tin && !client.nisNumber && <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {client.riskLevel ? (
                    <Badge variant={getRiskBadgeColor(client.riskLevel)}>
                      {client.riskLevel}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{client._count.documents}</TableCell>
                <TableCell className="text-right">{client._count.filings}</TableCell>
                <TableCell className="text-right">{client._count.serviceRequests}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={deletingId === client.id}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} clients
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => router.push(`?page=${pagination.page - 1}`)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => router.push(`?page=${pagination.page + 1}`)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
