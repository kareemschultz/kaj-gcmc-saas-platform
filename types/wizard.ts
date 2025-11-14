// Wizard framework types

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

export interface WizardState<T = any> {
  currentStepIndex: number;
  steps: WizardStep[];
  data: T;
  isComplete: boolean;
}

export interface WizardConfig {
  id: string;
  title: string;
  description?: string;
  steps: WizardStep[];
  // URL to redirect to on completion
  onCompleteRedirect?: string;
  // Allow saving draft
  allowDraft?: boolean;
}

export interface WizardContextValue<T = any> {
  config: WizardConfig;
  state: WizardState<T>;
  currentStep: WizardStep;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: (data: Partial<T>) => void;
  completeWizard: () => void;
}
