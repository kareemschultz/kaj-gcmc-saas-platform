// Document detail page

import { getDocument, getDocumentTypes, getClientsForSelect } from '@/lib/actions/documents';
import { DocumentForm } from '@/components/documents/document-form';
import { DocumentVersionsList } from '@/components/documents/document-versions-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const documentId = parseInt(params.id);
  
  if (isNaN(documentId)) {
    notFound();
  }

  let document;
  try {
    const [doc, documentTypes, clients] = await Promise.all([
      getDocument(documentId),
      getDocumentTypes(),
      getClientsForSelect(),
    ]);
    document = { ...doc, documentTypes, clients };
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit document details and manage versions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Document Information</h2>
          <DocumentForm 
            document={document} 
            documentTypes={document.documentTypes} 
            clients={document.clients} 
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Document Versions</h2>
          <DocumentVersionsList documentId={documentId} versions={document.versions} />
        </div>
      </div>
    </div>
  );
}
