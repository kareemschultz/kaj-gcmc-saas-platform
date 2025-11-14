'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ComplianceSetupWizardData } from '@/src/lib/actions/wizards';

const AUTHORITIES = [
  { code: 'GRA', name: 'Guyana Revenue Authority', description: 'Tax compliance and filings' },
  { code: 'NIS', name: 'National Insurance Scheme', description: 'Employee contributions and certificates' },
  { code: 'DCRA', name: 'Deeds & Commercial Registry Authority', description: 'Business registration and annual returns' },
  { code: 'Immigration', name: 'Immigration', description: 'Work permits and residence permits' },
  { code: 'Deeds', name: 'Deeds Registry', description: 'Property transfers and mortgages' },
  { code: 'GO-Invest', name: 'GO-Invest', description: 'Investment registration and incentives' },
];

export function SelectAuthoritiesStep() {
  const { state, updateData } = useWizard<ComplianceSetupWizardData>();
  const data = state.data;
  const selectedAuthorities = data.selectedAuthorities || [];

  const toggleAuthority = (authorityCode: string) => {
    if (selectedAuthorities.includes(authorityCode)) {
      updateData({
        selectedAuthorities: selectedAuthorities.filter((a) => a !== authorityCode),
      });
    } else {
      updateData({
        selectedAuthorities: [...selectedAuthorities, authorityCode],
      });
    }
  };

  const handleNext = () => {
    if (selectedAuthorities.length === 0) {
      alert('Please select at least one authority');
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Select the regulatory authorities that are relevant to this client. This will determine
          which compliance bundles are available in the next step.
        </p>
      </div>

      <div className="grid gap-4">
        {AUTHORITIES.map((authority) => {
          const isSelected = selectedAuthorities.includes(authority.code);

          return (
            <Card
              key={authority.code}
              className={`p-4 cursor-pointer transition-colors ${
                isSelected ? 'border-teal-600 bg-teal-50' : 'hover:border-gray-400'
              }`}
              onClick={() => toggleAuthority(authority.code)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`auth-${authority.code}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleAuthority(authority.code)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`auth-${authority.code}`}
                    className="font-medium cursor-pointer block text-lg"
                  >
                    {authority.code} - {authority.name}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">{authority.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="text-sm">
          <strong>Selected:</strong> {selectedAuthorities.length} authority/authorities
        </div>
      </div>

      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
