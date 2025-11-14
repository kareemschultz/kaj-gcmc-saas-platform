'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-context';
import { WizardLayout } from '@/components/wizard/wizard-layout';
import { WizardConfig } from '@/types/wizard';
import {
  ComplianceSetupWizardData,
  completeComplianceSetupWizard,
} from '@/lib/actions/wizards';
import { SelectAuthoritiesStep } from './compliance-setup/select-authorities-step';
import { SelectBundlesStep } from './compliance-setup/select-bundles-step';
import { ConfigureBundlesStep } from './compliance-setup/configure-bundles-step';
import { CreateTasksStep } from './compliance-setup/create-tasks-step';
import { ComplianceReviewStep } from './compliance-setup/compliance-review-step';
import { toast } from 'sonner';

interface ComplianceSetupWizardProps {
  client: any;
  bundles: any[];
}

const wizardConfig: WizardConfig = {
  id: 'compliance-setup',
  title: 'Compliance Setup Wizard',
  description: 'Configure compliance requirements and bundles for this client',
  steps: [
    {
      id: 'select-authorities',
      title: 'Authorities',
      description: 'Select relevant regulatory authorities',
    },
    {
      id: 'select-bundles',
      title: 'Bundles',
      description: 'Choose compliance bundles to apply',
    },
    {
      id: 'configure-bundles',
      title: 'Configure',
      description: 'Customize bundle requirements',
      optional: true,
    },
    {
      id: 'create-tasks',
      title: 'Tasks',
      description: 'Auto-create tasks for missing items',
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and confirm',
    },
  ],
};

export function ComplianceSetupWizard({ client, bundles }: ComplianceSetupWizardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData: Partial<ComplianceSetupWizardData> = {
    clientId: client.id,
    selectedAuthorities: [],
    selectedBundleIds: [],
    disabledBundleItems: {},
    createTasksForGaps: true,
  };

  const handleComplete = async (data: ComplianceSetupWizardData) => {
    setIsSubmitting(true);
    try {
      const result = await completeComplianceSetupWizard(data);
      if (result.success) {
        toast.success('Compliance setup completed successfully!');
        router.push(`/clients/${result.clientId}`);
      }
    } catch (error) {
      console.error('Failed to complete compliance setup:', error);
      toast.error('Failed to complete compliance setup. Please try again.');
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
      <WizardContent client={client} bundles={bundles} isSubmitting={isSubmitting} />
    </WizardProvider>
  );
}

function WizardContent({
  client,
  bundles,
  isSubmitting,
}: ComplianceSetupWizardProps & { isSubmitting: boolean }) {
  return (
    <WizardLayout>
      <WizardStepRenderer client={client} bundles={bundles} isSubmitting={isSubmitting} />
    </WizardLayout>
  );
}

function WizardStepRenderer({
  client,
  bundles,
  isSubmitting,
}: ComplianceSetupWizardProps & { isSubmitting: boolean }) {
  const { state } = useWizard();
  const currentStepId = state.steps[state.currentStepIndex].id;

  switch (currentStepId) {
    case 'select-authorities':
      return <SelectAuthoritiesStep />;
    case 'select-bundles':
      return <SelectBundlesStep bundles={bundles} />;
    case 'configure-bundles':
      return <ConfigureBundlesStep bundles={bundles} />;
    case 'create-tasks':
      return <CreateTasksStep />;
    case 'review':
      return <ComplianceReviewStep client={client} bundles={bundles} isSubmitting={isSubmitting} />;
    default:
      return null;
  }
}
