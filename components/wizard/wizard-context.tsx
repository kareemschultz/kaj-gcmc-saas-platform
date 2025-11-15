'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WizardConfig, WizardState, WizardContextValue } from '@/types/wizard';

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard<T = any>() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context as WizardContextValue<T>;
}

interface WizardProviderProps<T = any> {
  config: WizardConfig;
  initialData?: T;
  children: ReactNode;
  onComplete?: (data: T) => void | Promise<void>;
}

export function WizardProvider<T = any>({
  config,
  initialData,
  children,
  onComplete,
}: WizardProviderProps<T>) {
  const [state, setState] = useState<WizardState<T>>({
    currentStepIndex: 0,
    steps: config.steps,
    data: initialData || ({} as T),
    isComplete: false,
  });

  const currentStep = state.steps[state.currentStepIndex];
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < state.steps.length) {
      setState((prev) => ({ ...prev, currentStepIndex: index }));
    }
  }, [state.steps.length]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setState((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }));
    }
  }, [isLastStep]);

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      setState((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex - 1 }));
    }
  }, [isFirstStep]);

  const updateData = useCallback((newData: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...newData },
    }));
  }, []);

  const completeWizard = useCallback(async () => {
    setState((prev) => ({ ...prev, isComplete: true }));
    if (onComplete) {
      await onComplete(state.data);
    }
  }, [onComplete, state.data]);

  const value: WizardContextValue<T> = {
    config,
    state,
    currentStep,
    isFirstStep,
    isLastStep,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    completeWizard,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
