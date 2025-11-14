'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ComplianceSetupWizardData } from '@/src/lib/actions/wizards';

interface SelectBundlesStepProps {
  bundles: any[];
}

export function SelectBundlesStep({ bundles }: SelectBundlesStepProps) {
  const { state, updateData } = useWizard<ComplianceSetupWizardData>();
  const data = state.data;
  const selectedAuthorities = data.selectedAuthorities || [];
  const selectedBundleIds = data.selectedBundleIds || [];

  const relevantBundles = bundles.filter((b) => selectedAuthorities.includes(b.authority));

  const toggleBundle = (bundleId: number) => {
    if (selectedBundleIds.includes(bundleId)) {
      updateData({
        selectedBundleIds: selectedBundleIds.filter((id) => id !== bundleId),
      });
    } else {
      updateData({
        selectedBundleIds: [...selectedBundleIds, bundleId],
      });
    }
  };

  const handleNext = () => {
    if (selectedBundleIds.length === 0) {
      alert('Please select at least one bundle');
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Select the compliance bundles to apply to this client. Each bundle contains a set of
          required documents and filings.
        </p>
      </div>

      {selectedAuthorities.map((authority) => {
        const authorityBundles = relevantBundles.filter((b) => b.authority === authority);
        if (authorityBundles.length === 0) return null;

        return (
          <div key={authority}>
            <h3 className="font-semibold text-lg mb-3 text-teal-700">{authority} Bundles</h3>
            <div className="grid gap-3">
              {authorityBundles.map((bundle) => {
                const isSelected = selectedBundleIds.includes(bundle.id);

                return (
                  <Card
                    key={bundle.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-teal-600 bg-teal-50' : 'hover:border-gray-400'
                    }`}
                    onClick={() => toggleBundle(bundle.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`bundle-${bundle.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleBundle(bundle.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor={`bundle-${bundle.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {bundle.name}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {bundle.category}
                          </Badge>
                        </div>
                        {bundle.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {bundle.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{bundle.items.length} requirement(s)</span>
                          <span>
                            {bundle.items.filter((i: any) => i.documentTypeId).length} documents
                          </span>
                          <span>
                            {bundle.items.filter((i: any) => i.filingTypeId).length} filings
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="text-sm">
          <strong>Selected:</strong> {selectedBundleIds.length} bundle(s)
        </div>
      </div>

      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
