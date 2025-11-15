'use client';

// Document Preview Component
// Displays PDF viewer, image viewer, or download button for other file types

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Loader2, ExternalLink } from 'lucide-react';
import { getDownloadUrl } from '@/lib/actions/document-upload';
import { toast } from 'sonner';

interface DocumentPreviewProps {
  versionId: number;
  mimeType: string | null;
  fileName?: string;
  className?: string;
}

export function DocumentPreview({
  versionId,
  mimeType,
  fileName = 'document',
  className = '',
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPreview = (): boolean => {
    if (!mimeType) return false;
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
  };

  const loadPreview = async () => {
    if (!canPreview()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { downloadUrl } = await getDownloadUrl(versionId);
      setPreviewUrl(downloadUrl);
    } catch (err) {
      console.error('Preview load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
      toast.error('Preview failed', {
        description: 'Could not load document preview',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [versionId]);

  const handleDownload = async () => {
    try {
      const { downloadUrl, fileName: actualFileName } = await getDownloadUrl(versionId);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = actualFileName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed', {
        description: err instanceof Error ? err.message : 'Failed to download file',
      });
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/50 p-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/50 bg-destructive/10 p-8 ${className}`}>
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-sm font-medium text-destructive">Preview Error</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleDownload} variant="outline" className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Download Instead
          </Button>
        </div>
      </div>
    );
  }

  // Cannot preview - show download option
  if (!canPreview() || !previewUrl) {
    return (
      <div className={`rounded-lg border border-dashed p-8 ${className}`}>
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium">Preview Not Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This file type cannot be previewed in the browser.
          </p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>
    );
  }

  // PDF Preview
  if (mimeType === 'application/pdf') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>PDF Document</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        <div className="relative rounded-b-lg border">
          <iframe
            src={previewUrl}
            className="h-[600px] w-full rounded-b-lg"
            title="PDF Preview"
          />
        </div>
      </div>
    );
  }

  // Image Preview
  if (mimeType?.startsWith('image/')) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Image Preview</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Size
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-b-lg border bg-muted/50">
          <img
            src={previewUrl}
            alt="Document preview"
            className="mx-auto max-h-[600px] w-auto object-contain p-4"
          />
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Simplified Document Preview Dialog Component
 * Can be used in a dialog/modal
 */
interface DocumentPreviewDialogProps {
  versionId: number;
  mimeType: string | null;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewDialog({
  versionId,
  mimeType,
  fileName,
  isOpen,
  onClose,
}: DocumentPreviewDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Document Preview</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            Close
          </Button>
        </div>
        <DocumentPreview
          versionId={versionId}
          mimeType={mimeType}
          fileName={fileName}
        />
      </div>
    </div>
  );
}
