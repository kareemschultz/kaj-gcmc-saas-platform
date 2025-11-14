'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ServiceRequestWizardData } from '@/src/lib/actions/wizards';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

interface ConfigureWorkflowStepProps {
  services: any[];
}

export function ConfigureWorkflowStep({ services }: ConfigureWorkflowStepProps) {
  const { state, updateData } = useWizard<ServiceRequestWizardData>();
  const data = state.data;
  const customSteps = data.customSteps || [];

  const selectedService = services.find((s) => s.id === data.serviceId);
  const selectedTemplate = selectedService?.templates?.find(
    (t: any) => t.id === data.templateId
  );

  const addStep = () => {
    updateData({
      customSteps: [
        ...customSteps,
        {
          title: '',
          description: '',
          order: customSteps.length + 1,
        },
      ],
    });
  };

  const removeStep = (index: number) => {
    const updated = customSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order: i + 1 }));
    updateData({ customSteps: updated });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = customSteps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    );
    updateData({ customSteps: updated });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === customSteps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...customSteps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const reordered = updated.map((step, i) => ({ ...step, order: i + 1 }));
    updateData({ customSteps: reordered });
  };

  return (
    <div className="space-y-6">
      {selectedTemplate ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Template Selected:</strong> {selectedTemplate.name}
            <br />
            Workflow steps will be automatically loaded from this template. You can skip this step.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Define custom workflow steps for this service request. This step is optional - you
              can also add steps later.
            </p>
          </div>

          {customSteps.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No custom steps defined</p>
              <Button onClick={addStep} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Step
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {customSteps.map((step, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-teal-600">Step {index + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === customSteps.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Step Title</Label>
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        placeholder="e.g., Collect client documents"
                      />
                    </div>

                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={step.description || ''}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        placeholder="Details about this step"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Due Date (Optional)</Label>
                      <Input
                        type="date"
                        value={step.dueDate || ''}
                        onChange={(e) => updateStep(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Button onClick={addStep} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Step
              </Button>
            </div>
          )}
        </>
      )}

      <WizardNavigation />
    </div>
  );
}
