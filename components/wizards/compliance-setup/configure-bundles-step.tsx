'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ComplianceSetupWizardData } from '@/src/lib/actions/wizards';

interface ConfigureBundlesStepProps {
  bundles: any[];
}

export function ConfigureBundlesStep({ bundles }: ConfigureBundlesStepProps) {
  const { state, updateData } = useWizard<ComplianceSetupWizardData>();
  const data = state.data;
  const selectedBundleIds = data.selectedBundleIds || [];
  const disabledBundleItems = data.disabledBundleItems || {};

  const selectedBundles = bundles.filter((b) => selectedBundleIds.includes(b.id));

  const toggleBundleItem = (bundleId: number, itemId: number) => {
    const currentDisabled = disabledBundleItems[bundleId] || [];
    const newDisabled = currentDisabled.includes(itemId)
      ? currentDisabled.filter((id) => id !== itemId)
      : [...currentDisabled, itemId];

    updateData({
      disabledBundleItems: {
        ...disabledBundleItems,
        [bundleId]: newDisabled,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Optional:</strong> Review and customize which requirements from each bundle should
          be applied. Uncheck any items that are not relevant to this specific client.
        </p>
      </div>

      {selectedBundles.map((bundle) => {
        const disabledItems = disabledBundleItems[bundle.id] || [];

        return (
          <Card key={bundle.id} className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{bundle.name}</h3>
              <p className="text-sm text-muted-foreground">
                {bundle.authority} • {bundle.category}
              </p>
            </div>

            <div className="space-y-2">
              {bundle.items.map((item: any) => {
                const isEnabled = !disabledItems.includes(item.id);
                const itemName = item.documentType?.name || item.filingType?.name || 'Unknown';
                const itemType = item.documentTypeId ? 'Document' : 'Filing';

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isEnabled ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={isEnabled}
                      onCheckedChange={() => toggleBundleItem(bundle.id, item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`item-${item.id}`}
                        className={`font-medium cursor-pointer block ${
                          isEnabled ? '' : 'text-muted-foreground'
                        }`}
                      >
                        {itemName}
                      </label>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {itemType}
                        </Badge>
                        {item.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {!item.required && (
                          <Badge variant="secondary" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <WizardNavigation />
    </div>
  );
}
