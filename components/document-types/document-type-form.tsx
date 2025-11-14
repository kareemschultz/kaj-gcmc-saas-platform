'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  type DocumentTypeFormData,
} from '@/lib/actions/document-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentTypeFormProps {
  documentType?: {
    id: number;
    name: string;
    category: string;
    description: string | null;
    tags: string[];
    _count?: { documents: number };
  };
}

const CATEGORIES = [
  { value: 'tax', label: 'Tax' },
  { value: 'registration', label: 'Registration' },
  { value: 'certification', label: 'Certification' },
  { value: 'identification', label: 'Identification' },
  { value: 'permit', label: 'Permit' },
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financial' },
  { value: 'compliance', label: 'Compliance' },
];

export function DocumentTypeForm({ documentType }: DocumentTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: documentType?.name || '',
    category: documentType?.category || '',
    description: documentType?.description || undefined,
    tags: documentType?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (documentType) {
          await updateDocumentType(documentType.id, formData);
        } else {
          await createDocumentType(formData);
        }
        router.push('/document-types');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!documentType) return;
    if (!confirm(`Are you sure you want to delete "${documentType.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteDocumentType(documentType.id);
        router.push('/document-types');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete document type');
      }
    });
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., GRA Income Tax Return"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
            placeholder="Optional description"
            rows={3}
            disabled={isPending}
          />
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              disabled={isPending}
            />
            <Button type="button" onClick={addTag} disabled={isPending || !tagInput}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isPending}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {documentType && documentType._count && documentType._count.documents === 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : documentType ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
