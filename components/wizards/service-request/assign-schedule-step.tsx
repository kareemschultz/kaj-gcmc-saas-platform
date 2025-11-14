'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ServiceRequestWizardData } from '@/src/lib/actions/wizards';

export function AssignAndScheduleStep() {
  const { state, updateData } = useWizard<ServiceRequestWizardData>();
  const data = state.data;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Configure task creation and assignment options for this service request.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Task Management</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="create-tasks"
              checked={data.createTasks}
              onCheckedChange={(checked) =>
                updateData({ createTasks: checked as boolean })
              }
            />
            <div className="flex-1">
              <Label htmlFor="create-tasks" className="text-base font-medium cursor-pointer">
                Automatically create initial task
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, a task will be created to track this service request. The task will
                be linked to the service request and can be assigned to a staff member.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold mb-3">Next Steps</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>The service request will be created with "New" status</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>Workflow steps will be added based on your configuration</span>
          </li>
          {data.createTasks && (
            <li className="flex items-start gap-2">
              <span className="text-teal-600">•</span>
              <span>A task will be created and can be assigned on the service request page</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-teal-600">•</span>
            <span>You'll be able to manage progress and communicate with the client</span>
          </li>
        </ul>
      </Card>

      <WizardNavigation />
    </div>
  );
}
