// Create new document page

import { DocumentForm } from '@/components/documents/document-form';
import { getDocumentTypes, getClientsForSelect } from '@/src/lib/actions/documents';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewDocumentPage() {
  const [documentTypes, clients] = await Promise.all([
    getDocumentTypes(),
    getClientsForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Document</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a new document to the system
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border bg-card p-6">
          <DocumentForm documentTypes={documentTypes} clients={clients} />
        </div>
      </div>
    </div>
  );
}
