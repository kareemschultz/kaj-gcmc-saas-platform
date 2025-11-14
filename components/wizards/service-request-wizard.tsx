'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardLayout } from '@/components/wizard/wizard-layout';
import { WizardConfig } from '@/src/types/wizard';
import {
  ServiceRequestWizardData,
  completeServiceRequestWizard,
} from '@/src/lib/actions/wizards';
import { SelectClientStep } from './service-request/select-client-step';
import { SelectServiceStep } from './service-request/select-service-step';
import { ConfigureWorkflowStep } from './service-request/configure-workflow-step';
import { AssignAndScheduleStep } from './service-request/assign-schedule-step';
import { ServiceRequestReviewStep } from './service-request/service-request-review-step';
import { toast } from 'sonner';

interface ServiceRequestWizardProps {
  clients: any[];
  services: any[];
}

const wizardConfig: WizardConfig = {
  id: 'service-request',
  title: 'New Service Request Wizard',
  description: 'Create a new service request with workflow configuration',
  steps: [
    {
      id: 'select-client',
      title: 'Client',
      description: 'Select the client for this service request',
    },
    {
      id: 'select-service',
      title: 'Service',
      description: 'Choose the service to provide',
    },
    {
      id: 'configure-workflow',
      title: 'Workflow',
      description: 'Configure workflow steps',
      optional: true,
    },
    {
      id: 'assign-schedule',
      title: 'Assign',
      description: 'Assignment and scheduling',
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and create',
    },
  ],
};

export function ServiceRequestWizard({ clients, services }: ServiceRequestWizardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData: Partial<ServiceRequestWizardData> = {
    clientId: 0,
    serviceId: 0,
    priority: 'medium',
    createTasks: true,
    customSteps: [],
  };

  const handleComplete = async (data: ServiceRequestWizardData) => {
    setIsSubmitting(true);
    try {
      const result = await completeServiceRequestWizard(data);
      if (result.success) {
        toast.success('Service request created successfully!');
        router.push(`/services/requests/${result.serviceRequestId}`);
      }
    } catch (error) {
      console.error('Failed to create service request:', error);
      toast.error('Failed to create service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardProvider
      config={wizardConfig}
      initialData={initialData}
      onComplete={handleComplete}
    >
      <WizardContent clients={clients} services={services} isSubmitting={isSubmitting} />
    </WizardProvider>
  );
}

function WizardContent({
  clients,
  services,
  isSubmitting,
}: ServiceRequestWizardProps & { isSubmitting: boolean }) {
  return (
    <WizardLayout>
      <WizardStepRenderer clients={clients} services={services} isSubmitting={isSubmitting} />
    </WizardLayout>
  );
}

function WizardStepRenderer({
  clients,
  services,
  isSubmitting,
}: ServiceRequestWizardProps & { isSubmitting: boolean }) {
  const { state } = useWizard();
  const currentStepId = state.steps[state.currentStepIndex].id;

  switch (currentStepId) {
    case 'select-client':
      return <SelectClientStep clients={clients} />;
    case 'select-service':
      return <SelectServiceStep services={services} />;
    case 'configure-workflow':
      return <ConfigureWorkflowStep services={services} />;
    case 'assign-schedule':
      return <AssignAndScheduleStep />;
    case 'review':
      return (
        <ServiceRequestReviewStep
          clients={clients}
          services={services}
          isSubmitting={isSubmitting}
        />
      );
    default:
      return null;
  }
}
