'use client';

// Document Uploader Component
// Features: drag-and-drop, file validation, progress tracking, image preview

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { getUploadUrl, confirmUpload } from '@/lib/actions/document-upload';
import { toast } from 'sonner';

// Accepted file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface DocumentUploaderProps {
  documentId: number;
  onUploadComplete?: () => void;
}

export function DocumentUploader({ documentId, onUploadComplete }: DocumentUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');

  // Validate file type and size
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type);
    if (!isValidType) {
      return {
        valid: false,
        error: 'File type not supported. Please upload PDF, DOCX, XLSX, or image files.',
      };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast.error('Invalid file', {
        description: validation.error,
      });
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      setUploadProgress(10);
      const { uploadUrl, filePath } = await getUploadUrl(
        documentId,
        selectedFile.name,
        selectedFile.type
      );

      // Step 2: Upload file to MinIO
      setUploadProgress(30);
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(70);

      // Step 3: Confirm upload and create document version
      await confirmUpload({
        documentId,
        fileUrl: filePath,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        issuingAuthority: issuingAuthority || undefined,
      });

      setUploadProgress(100);

      toast.success('File uploaded successfully', {
        description: `${selectedFile.name} has been uploaded.`,
      });

      // Reset form
      clearFile();
      setIssueDate('');
      setExpiryDate('');
      setIssuingAuthority('');

      // Callback and refresh
      if (onUploadComplete) {
        onUploadComplete();
      }
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Failed to upload file',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${!selectedFile && !isUploading ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
          onChange={handleInputChange}
          disabled={isUploading}
        />

        {!selectedFile ? (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag and drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supported: PDF, DOCX, XLSX, PNG, JPG (Max 50MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-start justify-center gap-4">
              {previewUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-muted">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Fields */}
      {selectedFile && !isUploading && (
        <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date (Optional)</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="issuingAuthority">Issuing Authority (Optional)</Label>
            <Input
              id="issuingAuthority"
              type="text"
              placeholder="e.g., GRA, NIS, DCRA"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
          size="lg"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      )}

      {/* Info Message */}
      <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Files are securely uploaded to MinIO object storage with tenant isolation.
          Upload URLs expire in 15 minutes.
        </p>
      </div>
    </div>
  );
}
