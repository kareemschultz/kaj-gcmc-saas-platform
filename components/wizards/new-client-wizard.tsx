'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProvider } from '@/components/wizard/wizard-context';
import { WizardLayout } from '@/components/wizard/wizard-layout';
import { WizardConfig } from '@/types/wizard';
import { NewClientWizardData, completeNewClientWizard } from '@/lib/actions/wizards';
import { ClientBasicInfoStep } from './new-client/client-basic-info-step';
import { ClientBusinessesStep } from './new-client/client-businesses-step';
import { AuthoritiesAndBundlesStep } from './new-client/authorities-bundles-step';
import { InitialServicesStep } from './new-client/initial-services-step';
import { ReviewAndConfirmStep } from './new-client/review-confirm-step';
import { toast } from 'sonner';

interface NewClientWizardProps {
  bundles: any[];
  services: any[];
}

const wizardConfig: WizardConfig = {
  id: 'new-client-onboarding',
  title: 'New Client Onboarding',
  description: 'Complete this wizard to onboard a new client with compliance setup',
  steps: [
    {
      id: 'basic-info',
      title: 'Basic Info',
      description: 'Client contact and identification details',
    },
    {
      id: 'businesses',
      title: 'Businesses',
      description: 'Business entities associated with this client',
      optional: true,
    },
    {
      id: 'authorities-bundles',
      title: 'Compliance',
      description: 'Select relevant authorities and compliance bundles',
    },
    {
      id: 'initial-services',
      title: 'Services',
      description: 'Create initial service requests',
      optional: true,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and confirm all details',
    },
  ],
};

export function NewClientWizard({ bundles, services }: NewClientWizardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData: Partial<NewClientWizardData> = {
    type: 'individual',
    riskLevel: 'medium',
    businesses: [],
    selectedBundleIds: [],
    initialServiceRequests: [],
  };

  const handleComplete = async (data: NewClientWizardData) => {
    setIsSubmitting(true);
    try {
      const result = await completeNewClientWizard(data);
      if (result.success) {
        toast.success('Client created successfully!');
        router.push(`/clients/${result.clientId}`);
      }
    } catch (error) {
      console.error('Failed to create client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardProvider
      config={wizardConfig}
      initialData={initialData as any}
      onComplete={handleComplete}
    >
      <WizardContent bundles={bundles} services={services} isSubmitting={isSubmitting} />
    </WizardProvider>
  );
}

function WizardContent({
  bundles,
  services,
  isSubmitting,
}: NewClientWizardProps & { isSubmitting: boolean }) {
  return (
    <WizardLayout>
      <WizardStepRenderer bundles={bundles} services={services} isSubmitting={isSubmitting} />
    </WizardLayout>
  );
}

function WizardStepRenderer({
  bundles,
  services,
  isSubmitting,
}: NewClientWizardProps & { isSubmitting: boolean }) {
  const { state } = useWizard();
  const currentStepId = state.steps[state.currentStepIndex].id;

  switch (currentStepId) {
    case 'basic-info':
      return <ClientBasicInfoStep />;
    case 'businesses':
      return <ClientBusinessesStep />;
    case 'authorities-bundles':
      return <AuthoritiesAndBundlesStep bundles={bundles} />;
    case 'initial-services':
      return <InitialServicesStep services={services} />;
    case 'review':
      return <ReviewAndConfirmStep bundles={bundles} services={services} isSubmitting={isSubmitting} />;
    default:
      return null;
  }
}

// Re-export useWizard for step components
import { useWizard } from '@/components/wizard/wizard-context';
