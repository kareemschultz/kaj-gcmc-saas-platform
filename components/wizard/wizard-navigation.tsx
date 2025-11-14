'use client';

import { Button } from '@/components/ui/button';
import { useWizard } from './wizard-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface WizardNavigationProps {
  onNext?: () => boolean | Promise<boolean>; // Return false to prevent navigation
  onPrevious?: () => void;
  onComplete?: () => void | Promise<void>;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
  hideNext?: boolean;
  hidePrevious?: boolean;
  nextDisabled?: boolean;
}

export function WizardNavigation({
  onNext,
  onPrevious,
  onComplete,
  nextLabel = 'Next',
  previousLabel = 'Back',
  completeLabel = 'Complete',
  hideNext = false,
  hidePrevious = false,
  nextDisabled = false,
}: WizardNavigationProps) {
  const { isFirstStep, isLastStep, nextStep, previousStep, completeWizard } = useWizard();

  const handleNext = async () => {
    let canProceed = true;
    if (onNext) {
      canProceed = await onNext();
    }
    if (canProceed) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
    previousStep();
  };

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete();
    }
    await completeWizard();
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <div>
        {!isFirstStep && !hidePrevious && (
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {previousLabel}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {!isLastStep && !hideNext && (
          <Button onClick={handleNext} disabled={nextDisabled}>
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        {isLastStep && (
          <Button onClick={handleComplete} className="bg-teal-600 hover:bg-teal-700">
            <Check className="w-4 h-4 mr-2" />
            {completeLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
