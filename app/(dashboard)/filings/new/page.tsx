// Create new filing page

import { FilingForm } from '@/components/filings/filing-form';
import { getFilingTypes, getClientsForFilingSelect } from '@/lib/actions/filings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewFilingPage() {
  const [filingTypes, clients] = await Promise.all([
    getFilingTypes(),
    getClientsForFilingSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/filings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Filing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new filing record
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-lg border bg-card p-6">
          <FilingForm filingTypes={filingTypes} clients={clients} />
        </div>
      </div>
    </div>
  );
}
