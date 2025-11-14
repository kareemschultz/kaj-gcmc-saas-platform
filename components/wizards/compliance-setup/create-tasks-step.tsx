'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ComplianceSetupWizardData } from '@/lib/actions/wizards';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function CreateTasksStep() {
  const { state, updateData } = useWizard<ComplianceSetupWizardData>();
  const data = state.data;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          The system can automatically create tasks for any missing documents or filings identified
          by the selected compliance bundles.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="create-tasks"
              checked={data.createTasksForGaps}
              onCheckedChange={(checked) =>
                updateData({ createTasksForGaps: checked as boolean })
              }
            />
            <div className="flex-1">
              <Label htmlFor="create-tasks" className="text-base font-medium cursor-pointer">
                Automatically create tasks for missing requirements
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, the system will analyze the selected bundles and create tasks for
                any documents or filings that the client doesn't currently have.
              </p>
            </div>
          </div>

          {data.createTasksForGaps ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <div className="font-medium">Tasks will be created automatically</div>
                  <div className="text-sm mt-1">
                    After completion, you'll find tasks in the Tasks section for collecting missing
                    documents and preparing required filings. Tasks will be assigned a priority
                    based on whether the requirement is mandatory or optional.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="font-medium">Manual task creation required</div>
                  <div className="text-sm mt-1">
                    You'll need to manually create tasks for any missing compliance requirements.
                    You can review the requirements on the client's compliance page.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-gray-50">
        <h4 className="font-medium mb-3">What happens next?</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>The selected compliance bundles will be associated with this client</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>The client's compliance score will be recalculated</span>
          </li>
          {data.createTasksForGaps && (
            <li className="flex items-start gap-2">
              <span className="text-teal-600">•</span>
              <span>Tasks will be created for missing documents and filings</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>An audit log entry will be created to track this compliance setup</span>
          </li>
        </ul>
      </Card>

      <WizardNavigation />
    </div>
  );
}
