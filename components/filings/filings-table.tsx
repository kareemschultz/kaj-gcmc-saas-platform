'use client';

// Filings table component

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import { deleteFiling } from '@/src/lib/actions/filings';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Filing {
  id: number;
  status: string;
  periodLabel: string | null;
  referenceNumber: string | null;
  total: number | null;
  submissionDate: Date | null;
  client: { id: number; name: string };
  filingType: { 
    id: number; 
    name: string; 
    code: string; 
    authority: string;
    frequency: string;
  };
  _count: {
    documents: number;
  };
}

interface FilingsTableProps {
  filings: Filing[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function FilingsTable({ filings, pagination }: FilingsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete this filing? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteFiling(id);
      toast({
        title: 'Filing deleted',
        description: 'Filing has been deleted successfully.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete filing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      prepared: 'default',
      submitted: 'default',
      approved: 'default',
      rejected: 'destructive',
      overdue: 'destructive',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getAuthorityColor = (authority: string) => {
    const colors: Record<string, string> = {
      GRA: 'text-[#1e40af]',
      NIS: 'text-[#15803d]',
      DCRA: 'text-[#9333ea]',
      Immigration: 'text-[#c2410c]',
    };
    return colors[authority] || 'text-foreground';
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filing Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Authority</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Docs</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No filings found. Create your first filing to get started.
              </TableCell>
            </TableRow>
          ) : (
            filings.map((filing) => (
              <TableRow key={filing.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/filings/${filing.id}`} className="hover:underline">
                    {filing.filingType.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{filing.filingType.frequency}</div>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/clients/${filing.client.id}`} className="text-sm hover:underline">
                    {filing.client.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getAuthorityColor(filing.filingType.authority)}>
                    {filing.filingType.authority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {filing.periodLabel || '—'}
                </TableCell>
                <TableCell>{getStatusBadge(filing.status)}</TableCell>
                <TableCell className="text-sm">
                  {filing.referenceNumber || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {filing.total ? `$${filing.total.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">{filing._count.documents}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/filings/${filing.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/filings/${filing.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(filing.id, filing.filingType.name)}
                        disabled={deletingId === filing.id}
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
            {pagination.total} filings
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
