'use client';

// Filing filtering component

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function FilingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const authority = searchParams.get('authority') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/dashboard/filings');
  };

  const hasFilters = search || status || authority;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search filings..."
          value={search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="prepared">Prepared</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select value={authority} onValueChange={(value) => updateFilter('authority', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Authorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Authorities</SelectItem>
          <SelectItem value="GRA">GRA</SelectItem>
          <SelectItem value="NIS">NIS</SelectItem>
          <SelectItem value="DCRA">DCRA</SelectItem>
          <SelectItem value="Immigration">Immigration</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
