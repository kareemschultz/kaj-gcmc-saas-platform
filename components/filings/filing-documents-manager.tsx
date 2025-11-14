'use client';

// Filing documents attachment manager

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { attachDocumentsToFiling } from '@/src/lib/actions/filings';
import { toast } from '@/hooks/use-toast';
import { FileText, LinkIcon } from 'lucide-react';

interface Document {
  id: number;
  title: string;
  status: string;
  documentType: {
    name: string;
    category: string;
  };
}

interface FilingDocumentsManagerProps {
  filingId: number;
  attachedDocuments: Document[];
  availableDocuments: Document[];
}

export function FilingDocumentsManager({ 
  filingId, 
  attachedDocuments, 
  availableDocuments 
}: FilingDocumentsManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>(
    attachedDocuments.map(d => d.id)
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = (docId: number) => {
    setSelectedIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await attachDocumentsToFiling(filingId, selectedIds);
      toast({
        title: 'Documents updated',
        description: 'Filing documents have been updated successfully.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select documents to attach to this filing
      </div>

      {availableDocuments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents available for this client.
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {availableDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <Checkbox
                id={`doc-${doc.id}`}
                checked={selectedIds.includes(doc.id)}
                onCheckedChange={() => handleToggle(doc.id)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={`doc-${doc.id}`}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.documentType.name} • {doc.status}
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={isUpdating}>
          <LinkIcon className="mr-2 h-4 w-4" />
          {isUpdating ? 'Updating...' : 'Update Attachments'}
        </Button>
        <div className="text-sm text-muted-foreground">
          {selectedIds.length} document{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      </div>
    </div>
  );
}
