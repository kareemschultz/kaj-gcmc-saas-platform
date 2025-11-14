'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewClientWizardData } from '@/src/lib/actions/wizards';

const AUTHORITIES = [
  { code: 'GRA', name: 'Guyana Revenue Authority', color: 'bg-green-100 text-green-800' },
  { code: 'NIS', name: 'National Insurance Scheme', color: 'bg-blue-100 text-blue-800' },
  { code: 'DCRA', name: 'Deeds & Commercial Registry Authority', color: 'bg-purple-100 text-purple-800' },
  { code: 'Immigration', name: 'Immigration', color: 'bg-orange-100 text-orange-800' },
  { code: 'Deeds', name: 'Deeds Registry', color: 'bg-teal-100 text-teal-800' },
  { code: 'GO-Invest', name: 'GO-Invest', color: 'bg-indigo-100 text-indigo-800' },
];

interface AuthoritiesAndBundlesStepProps {
  bundles: any[];
}

export function AuthoritiesAndBundlesStep({ bundles }: AuthoritiesAndBundlesStepProps) {
  const { state, updateData } = useWizard<NewClientWizardData>();
  const data = state.data;
  const selectedBundleIds = data.selectedBundleIds || [];

  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);

  const toggleAuthority = (authority: string) => {
    if (selectedAuthorities.includes(authority)) {
      setSelectedAuthorities(selectedAuthorities.filter((a) => a !== authority));
      // Deselect all bundles for this authority
      const bundlesToRemove = bundles
        .filter((b) => b.authority === authority)
        .map((b) => b.id);
      updateData({
        selectedBundleIds: selectedBundleIds.filter((id) => !bundlesToRemove.includes(id)),
      });
    } else {
      setSelectedAuthorities([...selectedAuthorities, authority]);
    }
  };

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

  const relevantBundles = bundles.filter((b) =>
    selectedAuthorities.length > 0 ? selectedAuthorities.includes(b.authority) : true
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Relevant Authorities</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {AUTHORITIES.map((auth) => (
            <Card key={auth.code} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`auth-${auth.code}`}
                  checked={selectedAuthorities.includes(auth.code)}
                  onCheckedChange={() => toggleAuthority(auth.code)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`auth-${auth.code}`}
                    className="font-medium cursor-pointer block"
                  >
                    {auth.code}
                  </label>
                  <p className="text-sm text-muted-foreground">{auth.name}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedAuthorities.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Select Compliance Bundles</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose pre-configured bundles to apply to this client. Each bundle contains a set of
            required documents and filings.
          </p>

          {selectedAuthorities.map((authority) => {
            const authorityBundles = bundles.filter((b) => b.authority === authority);
            if (authorityBundles.length === 0) return null;

            return (
              <div key={authority} className="mb-6">
                <h4 className="font-medium text-teal-700 mb-3">{authority} Bundles</h4>
                <div className="grid gap-3">
                  {authorityBundles.map((bundle) => (
                    <Card key={bundle.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`bundle-${bundle.id}`}
                          checked={selectedBundleIds.includes(bundle.id)}
                          onCheckedChange={() => toggleBundle(bundle.id)}
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
                          <div className="text-xs text-muted-foreground">
                            {bundle.items.length} requirement(s)
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WizardNavigation />
    </div>
  );
}
