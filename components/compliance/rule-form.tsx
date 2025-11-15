'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createComplianceRule,
  updateComplianceRule,
  deleteComplianceRule,
} from '@/lib/actions/compliance-rules';
import { type ComplianceRuleFormData } from '@/lib/schemas/compliance-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RuleFormProps {
  ruleSetId: number;
  rule?: {
    id: number;
    ruleType: string;
    description: string | null;
    weight: number;
    targetId: number | null;
  };
}

const RULE_TYPES = [
  { value: 'document_required', label: 'Document Required' },
  { value: 'filing_required', label: 'Filing Required' },
  { value: 'document_expiry_check', label: 'Document Expiry Check' },
];

export function RuleForm({ ruleSetId, rule }: RuleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!rule);

  const [formData, setFormData] = useState<Partial<ComplianceRuleFormData>>({
    ruleSetId,
    ruleType: rule?.ruleType || '',
    description: rule?.description || undefined,
    weight: rule?.weight ?? 1,
    targetId: rule?.targetId || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (rule) {
          await updateComplianceRule(rule.id, formData);
          setIsEditing(false);
        } else {
          await createComplianceRule(formData as ComplianceRuleFormData);
          // Reset form
          setFormData({
            ruleSetId,
            ruleType: '',
            description: undefined,
            weight: 1,
            targetId: undefined,
          });
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!rule) return;
    if (!confirm('Are you sure you want to delete this rule?')) return;

    startTransition(async () => {
      try {
        await deleteComplianceRule(rule.id);
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete rule');
      }
    });
  };

  const handleCancel = () => {
    if (rule) {
      setIsEditing(false);
      setFormData({
        ruleSetId,
        ruleType: rule.ruleType,
        description: rule.description || undefined,
        weight: rule.weight,
        targetId: rule.targetId || undefined,
      });
      setError(null);
    }
  };

  // View mode for existing rules
  if (rule && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-teal-100 text-teal-800">
                {RULE_TYPES.find(t => t.value === rule.ruleType)?.label || rule.ruleType}
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
                Weight: {rule.weight}
              </span>
              {rule.targetId && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                  Target ID: {rule.targetId}
                </span>
              )}
            </div>
            {rule.description && (
              <p className="text-sm text-gray-600">{rule.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create mode
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`ruleType-${rule?.id || 'new'}`}>Rule Type *</Label>
          <Select
            value={formData.ruleType}
            onValueChange={(value) => setFormData({ ...formData, ruleType: value })}
            disabled={isPending}
          >
            <SelectTrigger id={`ruleType-${rule?.id || 'new'}`}>
              <SelectValue placeholder="Select rule type" />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`weight-${rule?.id || 'new'}`}>Weight *</Label>
          <Input
            id={`weight-${rule?.id || 'new'}`}
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
            required
            disabled={isPending}
          />
          <p className="text-xs text-gray-500 mt-1">Importance factor (0.0 - 1.0)</p>
        </div>
      </div>

      <div>
        <Label htmlFor={`targetId-${rule?.id || 'new'}`}>Target ID</Label>
        <Input
          id={`targetId-${rule?.id || 'new'}`}
          type="number"
          value={formData.targetId || ''}
          onChange={(e) => setFormData({ ...formData, targetId: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Optional target entity ID"
          disabled={isPending}
        />
        <p className="text-xs text-gray-500 mt-1">Document type ID or filing type ID, depending on rule type</p>
      </div>

      <div>
        <Label htmlFor={`description-${rule?.id || 'new'}`}>Description</Label>
        <Textarea
          id={`description-${rule?.id || 'new'}`}
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
          placeholder="Optional description of this rule"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {rule && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : rule ? 'Update Rule' : 'Add Rule'}
        </Button>
      </div>
    </form>
  );
}
