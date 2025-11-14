'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createComplianceRuleSet,
  updateComplianceRuleSet,
  deleteComplianceRuleSet,
  type ComplianceRuleSetFormData,
} from '@/src/lib/actions/compliance-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RuleSetFormProps {
  ruleSet?: {
    id: number;
    name: string;
    appliesTo: any;
    active: boolean;
    rules?: any[];
  };
}

const CLIENT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'partnership', label: 'Partnership' },
];

const SECTORS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'education', label: 'Education' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'media', label: 'Media & Entertainment' },
];

export function RuleSetForm({ ruleSet }: RuleSetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const appliesTo = ruleSet?.appliesTo as { clientTypes?: string[]; sectors?: string[] } | null;

  const [formData, setFormData] = useState<ComplianceRuleSetFormData>({
    name: ruleSet?.name || '',
    appliesTo: {
      clientTypes: appliesTo?.clientTypes || [],
      sectors: appliesTo?.sectors || [],
    },
    active: ruleSet?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (ruleSet) {
          await updateComplianceRuleSet(ruleSet.id, formData);
          router.refresh();
        } else {
          const created = await createComplianceRuleSet(formData);
          router.push(`/compliance/rules/${created.id}`);
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  const handleDelete = async () => {
    if (!ruleSet) return;
    if (!confirm(`Are you sure you want to delete "${ruleSet.name}"? This will also delete all associated rules.`)) return;

    startTransition(async () => {
      try {
        await deleteComplianceRuleSet(ruleSet.id);
        router.push('/compliance/rules');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete rule set');
      }
    });
  };

  const toggleClientType = (value: string) => {
    const current = formData.appliesTo?.clientTypes || [];
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    setFormData({
      ...formData,
      appliesTo: { ...formData.appliesTo, clientTypes: updated },
    });
  };

  const toggleSector = (value: string) => {
    const current = formData.appliesTo?.sectors || [];
    const updated = current.includes(value)
      ? current.filter(s => s !== value)
      : [...current, value];
    setFormData({
      ...formData,
      appliesTo: { ...formData.appliesTo, sectors: updated },
    });
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
          <Label htmlFor="name">Rule Set Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Standard Tax Compliance"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label>Client Types</Label>
          <p className="text-sm text-gray-600 mb-2">Select which client types this rule set applies to (leave empty for all)</p>
          <div className="space-y-2">
            {CLIENT_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.appliesTo?.clientTypes?.includes(type.value) || false}
                  onChange={() => toggleClientType(type.value)}
                  disabled={isPending}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Sectors</Label>
          <p className="text-sm text-gray-600 mb-2">Select which sectors this rule set applies to (leave empty for all)</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTORS.map((sector) => (
              <label key={sector.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.appliesTo?.sectors?.includes(sector.value) || false}
                  onChange={() => toggleSector(sector.value)}
                  disabled={isPending}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{sector.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={isPending}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <p className="text-sm text-gray-600 ml-6">Only active rule sets will be enforced</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {ruleSet && (!ruleSet.rules || ruleSet.rules.length === 0) && (
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
            {isPending ? 'Saving...' : ruleSet ? 'Update Rule Set' : 'Create Rule Set'}
          </Button>
        </div>
      </div>
    </form>
  );
}
