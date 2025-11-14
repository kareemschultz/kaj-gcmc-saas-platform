'use client';

// Document versions list with upload functionality

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download } from 'lucide-react';
import { getUploadUrl, createDocumentVersion } from '@/lib/actions/documents';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DocumentVersion {
  id: number;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  uploadedAt: Date;
  isLatest: boolean;
}

interface DocumentVersionsListProps {
  documentId: number;
  versions: DocumentVersion[];
}

export function DocumentVersionsList({ documentId, versions }: DocumentVersionsListProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get presigned upload URL
      const { uploadUrl, storagePath } = await getUploadUrl(selectedFile.name);

      // Upload file to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Create document version record
      await createDocumentVersion({
        documentId,
        fileUrl: storagePath,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
      });

      toast({
        title: 'File uploaded',
        description: 'Document version has been uploaded successfully.',
      });

      setSelectedFile(null);
      setIssueDate('');
      setExpiryDate('');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload New Version */}
      <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
        <h3 className="font-medium">Upload New Version</h3>
        
        <div>
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="mt-1 text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload Version'}
        </Button>
      </div>

      {/* Versions List */}
      <div className="space-y-3">
        <h3 className="font-medium">Previous Versions ({versions.length})</h3>
        
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      Version {version.id}
                      {version.isLatest && (
                        <span className="ml-2 text-xs text-primary">(Latest)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                      {' • '}
                      {formatFileSize(version.fileSize)}
                    </div>
                    {version.expiryDate && (
                      <div className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(version.expiryDate), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
