'use client';

import { ReactNode } from 'react';
import { useWizard } from './wizard-context';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface WizardLayoutProps {
  children: ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const { config, state, currentStep } = useWizard();

  const progress = ((state.currentStepIndex + 1) / state.steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div>
        <h1 className="text-3xl font-bold">{config.title}</h1>
        {config.description && (
          <p className="text-muted-foreground mt-1">{config.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Step {state.currentStepIndex + 1} of {state.steps.length}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {state.steps.map((step, index) => {
          const isActive = index === state.currentStepIndex;
          const isCompleted = index < state.currentStepIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? 'bg-teal-600 border-teal-600'
                      : isActive
                      ? 'border-teal-600 bg-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-teal-600' : 'text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    isActive ? 'font-medium text-teal-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < state.steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
          )}
          {currentStep.optional && (
            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Optional
            </span>
          )}
        </div>
        {children}
      </Card>
    </div>
  );
}
