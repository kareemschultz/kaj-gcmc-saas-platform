'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceRequestWizardData } from '@/src/lib/actions/wizards';
import { Building2, Briefcase, ListChecks, CheckCircle2 } from 'lucide-react';

interface ServiceRequestReviewStepProps {
  clients: any[];
  services: any[];
  isSubmitting: boolean;
}

export function ServiceRequestReviewStep({
  clients,
  services,
  isSubmitting,
}: ServiceRequestReviewStepProps) {
  const { state } = useWizard<ServiceRequestWizardData>();
  const data = state.data;

  const selectedClient = clients.find((c) => c.id === data.clientId);
  const selectedService = services.find((s) => s.id === data.serviceId);
  const selectedTemplate = selectedService?.templates?.find(
    (t: any) => t.id === data.templateId
  );

  const customSteps = data.customSteps || [];
  const willUseTemplate = !!selectedTemplate;
  const willUseCustomSteps = !willUseTemplate && customSteps.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <p className="text-sm text-teal-800 font-medium">
            Review service request details before creating
          </p>
        </div>
      </div>

      {/* Client */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          Client
        </h3>
        <div>
          <div className="font-medium text-lg">{selectedClient?.name}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{selectedClient?.type}</Badge>
            {selectedClient?.sector && (
              <Badge variant="outline">{selectedClient?.sector}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Service */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Service
        </h3>
        <div>
          <div className="font-medium text-lg">{selectedService?.name}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{selectedService?.category}</Badge>
            <Badge
              variant={
                data.priority === 'urgent' || data.priority === 'high'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {data.priority} priority
            </Badge>
          </div>
          {data.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Notes:</div>
              <div className="text-sm text-muted-foreground">{data.notes}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Workflow */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-purple-600" />
          Workflow Configuration
        </h3>

        {willUseTemplate ? (
          <div>
            <div className="font-medium">Using Template: {selectedTemplate?.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Steps will be automatically loaded from the selected template
            </p>
          </div>
        ) : willUseCustomSteps ? (
          <div>
            <div className="font-medium mb-3">{customSteps.length} Custom Step(s)</div>
            <div className="space-y-2">
              {customSteps.map((step, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">
                    {index + 1}. {step.title}
                  </div>
                  {step.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  )}
                  {step.dueDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(step.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            No workflow steps configured. You can add them later.
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status:</dt>
            <dd className="font-medium">New</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Priority:</dt>
            <dd className="font-medium capitalize">{data.priority}</dd>
          </div>
          {willUseTemplate && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Template:</dt>
              <dd className="font-medium">{selectedTemplate?.name}</dd>
            </div>
          )}
          {willUseCustomSteps && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Custom Steps:</dt>
              <dd className="font-medium">{customSteps.length}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Auto-create Task:</dt>
            <dd className="font-medium">{data.createTasks ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </Card>

      <WizardNavigation
        completeLabel="Create Service Request"
        nextDisabled={isSubmitting}
      />
    </div>
  );
}
