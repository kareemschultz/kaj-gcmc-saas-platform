// Filing detail page

import { getFiling, getFilingTypes, getClientsForFilingSelect, getClientDocuments } from '@/src/lib/actions/filings';
import { FilingForm } from '@/components/filings/filing-form';
import { FilingDocumentsManager } from '@/components/filings/filing-documents-manager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface FilingDetailPageProps {
  params: {
    id: string;
  };
}

export default async function FilingDetailPage({ params }: FilingDetailPageProps) {
  const filingId = parseInt(params.id);
  
  if (isNaN(filingId)) {
    notFound();
  }

  let filing;
  let filingTypes;
  let clients;
  let clientDocuments;

  try {
    filing = await getFiling(filingId);
    [filingTypes, clients, clientDocuments] = await Promise.all([
      getFilingTypes(),
      getClientsForFilingSelect(),
      getClientDocuments(filing.clientId),
    ]);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/filings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {filing.filingType.name} - {filing.client.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filing.periodLabel || 'No period specified'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Filing Information</h2>
          <FilingForm 
            filing={filing} 
            filingTypes={filingTypes} 
            clients={clients} 
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Attached Documents</h2>
          <FilingDocumentsManager 
            filingId={filingId}
            attachedDocuments={filing.documents.map(fd => fd.document)}
            availableDocuments={clientDocuments}
          />
        </div>
      </div>
    </div>
  );
}
