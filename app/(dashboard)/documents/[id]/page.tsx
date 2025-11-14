// Document detail page with upload and version management

import { getDocument, getDocumentTypes, getClientsForSelect } from '@/lib/actions/documents';
import { DocumentForm } from '@/components/documents/document-form';
import { DocumentVersionsList } from '@/components/documents/document-versions-list';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { DocumentPreview } from '@/components/documents/document-preview';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, History, Eye } from 'lucide-react';
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

  const latestVersion = document.versions.find((v) => v.isLatest);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage document details, upload new versions, and view history
          </p>
        </div>
        {latestVersion && (
          <div className="text-right">
            <p className="text-sm font-medium">Current Version</p>
            <p className="text-xs text-muted-foreground">
              Version {latestVersion.id}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Document Info */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Document Information</h2>
            <DocumentForm
              document={document}
              documentTypes={document.documentTypes}
              clients={document.clients}
            />
          </div>
        </div>

        {/* Right Column - Upload & Versions */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Versions ({document.versions.length})
              </TabsTrigger>
              {latestVersion && (
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Upload New Version</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload a new version of this document. The latest version will be used
                  for compliance checks and reporting.
                </p>
                <DocumentUploader documentId={documentId} />
              </div>
            </TabsContent>

            <TabsContent value="versions" className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <DocumentVersionsList
                  documentId={documentId}
                  versions={document.versions}
                />
              </div>
            </TabsContent>

            {latestVersion && (
              <TabsContent value="preview" className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Current Version Preview</h2>
                  <DocumentPreview
                    versionId={latestVersion.id}
                    mimeType={latestVersion.mimeType}
                    fileName={document.title}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Versions</div>
          <div className="mt-2 text-2xl font-bold">{document.versions.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="mt-2 text-2xl font-bold capitalize">{document.status}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Client</div>
          <div className="mt-2 text-lg font-bold">{document.client.name}</div>
        </div>
      </div>
    </div>
  );
}
