'use client';

// Document versions list with download, delete, and preview actions

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Eye, AlertCircle } from 'lucide-react';
import { getDownloadUrl, deleteDocumentVersion } from '@/lib/actions/document-upload';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentVersion {
  id: number;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  uploadedAt: Date;
  isLatest: boolean;
  uploadedById: number | null;
}

interface DocumentVersionsListProps {
  documentId: number;
  versions: DocumentVersion[];
}

export function DocumentVersionsList({ documentId, versions }: DocumentVersionsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="h-5 w-5 text-muted-foreground" />;

    if (mimeType.startsWith('image/')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }

    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const handleDownload = async (versionId: number, fileName: string) => {
    setDownloadingId(versionId);

    try {
      const { downloadUrl, fileName: actualFileName } = await getDownloadUrl(versionId);

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = actualFileName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started', {
        description: 'Your file download has started.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Failed to download file',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (versionId: number) => {
    try {
      await deleteDocumentVersion(versionId);

      toast.success('Version deleted', {
        description: 'Document version has been deleted successfully.',
      });

      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed', {
        description: error instanceof Error ? error.message : 'Failed to delete version',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (versionId: number) => {
    try {
      const { downloadUrl } = await getDownloadUrl(versionId);

      // Open in new tab for preview
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Preview failed', {
        description: error instanceof Error ? error.message : 'Failed to preview file',
      });
    }
  };

  const canPreview = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    return (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('image/')
    );
  };

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No versions uploaded</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a document version to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Document Versions ({versions.length})</h3>
      </div>

      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(version.mimeType)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium truncate">
                    Version {version.id}
                  </div>
                  {version.isLatest && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Latest
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                  {' • '}
                  {formatFileSize(version.fileSize)}
                </div>
                {version.issueDate && (
                  <div className="text-xs text-muted-foreground">
                    Issued: {new Date(version.issueDate).toLocaleDateString()}
                  </div>
                )}
                {version.expiryDate && (
                  <div className="text-xs text-muted-foreground">
                    Expires: {formatDistanceToNow(new Date(version.expiryDate), { addSuffix: true })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Preview Button */}
              {canPreview(version.mimeType) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(version.id)}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {/* Download Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(version.id, `version-${version.id}`)}
                disabled={downloadingId === version.id}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingId(version.id)}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted from
              storage and the version record will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
