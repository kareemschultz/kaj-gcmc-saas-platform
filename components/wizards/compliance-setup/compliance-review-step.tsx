'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComplianceSetupWizardData } from '@/lib/actions/wizards';
import { Building2, FileCheck, CheckCircle2, ListTodo } from 'lucide-react';

interface ComplianceReviewStepProps {
  client: any;
  bundles: any[];
  isSubmitting: boolean;
}

export function ComplianceReviewStep({
  client,
  bundles,
  isSubmitting,
}: ComplianceReviewStepProps) {
  const { state } = useWizard<ComplianceSetupWizardData>();
  const data = state.data;

  const selectedBundles = bundles.filter((b) => data.selectedBundleIds?.includes(b.id));
  const disabledBundleItems = data.disabledBundleItems || {};

  // Calculate total requirements
  let totalRequirements = 0;
  let disabledRequirements = 0;
  selectedBundles.forEach((bundle) => {
    totalRequirements += bundle.items.length;
    disabledRequirements += (disabledBundleItems[bundle.id] || []).length;
  });
  const activeRequirements = totalRequirements - disabledRequirements;

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <p className="text-sm text-teal-800 font-medium">
            Review compliance setup before completing
          </p>
        </div>
      </div>

      {/* Client Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          Client
        </h3>
        <div>
          <div className="font-medium text-lg">{client.name}</div>
          <div className="text-sm text-muted-foreground flex gap-2 mt-1">
            <Badge variant="outline">{client.type}</Badge>
            <Badge variant="outline">{client.riskLevel}</Badge>
          </div>
        </div>
      </Card>

      {/* Selected Authorities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-purple-600" />
          Selected Authorities ({data.selectedAuthorities?.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.selectedAuthorities?.map((authority) => (
            <Badge key={authority} className="bg-teal-600">
              {authority}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Selected Bundles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Compliance Bundles ({selectedBundles.length})
        </h3>
        <div className="space-y-3">
          {selectedBundles.map((bundle) => {
            const disabledCount = (disabledBundleItems[bundle.id] || []).length;
            const enabledCount = bundle.items.length - disabledCount;

            return (
              <div key={bundle.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{bundle.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {bundle.authority} • {bundle.category}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {enabledCount} of {bundle.items.length} requirements enabled
                    </div>
                  </div>
                  <Badge variant="outline">{enabledCount} req.</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary Stats */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-green-600" />
          Summary
        </h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Total Bundles</dt>
            <dd className="text-2xl font-semibold text-teal-600">
              {selectedBundles.length}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Active Requirements</dt>
            <dd className="text-2xl font-semibold text-teal-600">{activeRequirements}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Auto-create Tasks</dt>
            <dd className="text-lg font-medium">
              {data.createTasksForGaps ? (
                <Badge className="bg-green-600">Yes</Badge>
              ) : (
                <Badge variant="outline">No</Badge>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <WizardNavigation completeLabel="Complete Setup" nextDisabled={isSubmitting} />
    </div>
  );
}
