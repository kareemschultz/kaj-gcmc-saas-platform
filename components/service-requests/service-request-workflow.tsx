'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createServiceStep,
  updateServiceStep,
  deleteServiceStep,
  type ServiceStepFormData,
} from '@/lib/actions/service-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceRequestWorkflowProps {
  serviceRequestId: number;
  steps: Array<{
    id: number;
    title: string;
    description: string | null;
    order: number;
    status: string;
    dueDate: Date | null;
    requiredDocTypeIds: number[];
    filing?: {
      id: number;
      status: string;
      filingType: {
        name: string;
      };
    } | null;
  }>;
}

export function ServiceRequestWorkflow({ serviceRequestId, steps }: ServiceRequestWorkflowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);

  const [newStepData, setNewStepData] = useState<Partial<ServiceStepFormData>>({
    title: '',
    description: '',
    status: 'not_started',
    order: steps.length,
  });

  const statusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
  };

  const statusIcons: Record<string, string> = {
    not_started: '○',
    in_progress: '◐',
    done: '●',
    blocked: '⊗',
  };

  const handleAddStep = async () => {
    if (!newStepData.title?.trim()) {
      setError('Step title is required');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createServiceStep({
          serviceRequestId,
          title: newStepData.title!,
          description: newStepData.description || undefined,
          order: newStepData.order || steps.length,
          status: newStepData.status || 'not_started',
          dueDate: newStepData.dueDate || undefined,
          requiredDocTypeIds: [],
        } as ServiceStepFormData);

        setNewStepData({
          title: '',
          description: '',
          status: 'not_started',
          order: steps.length + 1,
        });
        setIsAddingStep(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to create step');
      }
    });
  };

  const handleUpdateStepStatus = async (stepId: number, newStatus: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateServiceStep(stepId, { status: newStatus as any });
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to update step status');
      }
    });
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteServiceStep(stepId);
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to delete step');
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {steps.length === 0 && !isAddingStep ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">No workflow steps yet</p>
          <Button onClick={() => setIsAddingStep(true)} disabled={isPending}>
            Add First Step
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Existing Steps */}
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-4 p-4 bg-white border-2 border-teal-100 rounded-lg hover:border-teal-200 transition-colors"
            >
              {/* Step Number & Status Icon */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="text-2xl" title={step.status}>
                  {statusIcons[step.status]}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                    {step.description && (
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    )}

                    {/* Filing Info */}
                    {step.filing && (
                      <div className="mt-2 text-xs text-gray-500">
                        Linked to filing: <span className="font-medium">{step.filing.filingType.name}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full ${
                          step.filing.status === 'completed' ? 'bg-green-100 text-green-800' :
                          step.filing.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {step.filing.status}
                        </span>
                      </div>
                    )}

                    {/* Due Date */}
                    {step.dueDate && (
                      <div className="mt-2 text-xs text-gray-500">
                        Due: {new Date(step.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[step.status]}`}>
                      {step.status.replace(/_/g, ' ')}
                    </span>

                    <div className="flex gap-2">
                      <Select
                        value={step.status}
                        onValueChange={(value) => handleUpdateStepStatus(step.id, value)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Step Form */}
          {isAddingStep && (
            <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Step</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="stepTitle" className="text-xs">Title *</Label>
                  <Input
                    id="stepTitle"
                    value={newStepData.title || ''}
                    onChange={(e) => setNewStepData({ ...newStepData, title: e.target.value })}
                    placeholder="Step title"
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="stepDescription" className="text-xs">Description</Label>
                  <Textarea
                    id="stepDescription"
                    value={newStepData.description || ''}
                    onChange={(e) => setNewStepData({ ...newStepData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="stepStatus" className="text-xs">Status</Label>
                    <Select
                      value={newStepData.status || 'not_started'}
                      onValueChange={(value) => setNewStepData({ ...newStepData, status: value as any })}
                      disabled={isPending}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="stepDueDate" className="text-xs">Due Date</Label>
                    <Input
                      id="stepDueDate"
                      type="date"
                      value={newStepData.dueDate?.toString().split('T')[0] || ''}
                      onChange={(e) => setNewStepData({
                        ...newStepData,
                        dueDate: e.target.value ? e.target.value : undefined
                      })}
                      disabled={isPending}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingStep(false);
                      setNewStepData({
                        title: '',
                        description: '',
                        status: 'not_started',
                        order: steps.length,
                      });
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddStep}
                    disabled={isPending}
                  >
                    {isPending ? 'Adding...' : 'Add Step'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add Step Button */}
          {!isAddingStep && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingStep(true)}
              disabled={isPending}
              className="w-full border-2 border-dashed border-teal-300 hover:border-teal-400 hover:bg-teal-50"
            >
              + Add Step
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
