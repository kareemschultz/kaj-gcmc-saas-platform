'use client';

// Client filtering component

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const riskLevel = searchParams.get('riskLevel') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/dashboard/clients');
  };

  const hasFilters = search || type || riskLevel;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <Select value={type} onValueChange={(value) => updateFilter('type', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          <SelectItem value="individual">Individual</SelectItem>
          <SelectItem value="company">Company</SelectItem>
          <SelectItem value="partnership">Partnership</SelectItem>
        </SelectContent>
      </Select>

      <Select value={riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Risk Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Risk Levels</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
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
