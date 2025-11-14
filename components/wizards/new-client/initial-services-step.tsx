'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NewClientWizardData } from '@/src/lib/actions/wizards';
import { Plus, Trash2 } from 'lucide-react';

interface InitialServicesStepProps {
  services: any[];
}

export function InitialServicesStep({ services }: InitialServicesStepProps) {
  const { state, updateData } = useWizard<NewClientWizardData>();
  const data = state.data;
  const serviceRequests = data.initialServiceRequests || [];

  const addServiceRequest = () => {
    updateData({
      initialServiceRequests: [
        ...serviceRequests,
        {
          serviceId: services[0]?.id || 0,
          priority: 'medium',
          notes: '',
        },
      ],
    });
  };

  const removeServiceRequest = (index: number) => {
    const updated = serviceRequests.filter((_, i) => i !== index);
    updateData({ initialServiceRequests: updated });
  };

  const updateServiceRequest = (index: number, field: string, value: any) => {
    const updated = serviceRequests.map((sr, i) =>
      i === index ? { ...sr, [field]: value } : sr
    );
    updateData({ initialServiceRequests: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          This step is optional. You can create initial service requests for this client or skip
          and add them later.
        </p>
      </div>

      {serviceRequests.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No service requests added yet</p>
          <Button onClick={addServiceRequest} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Service Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {serviceRequests.map((sr, index) => {
            const service = services.find((s) => s.id === sr.serviceId);

            return (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Service Request {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeServiceRequest(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label>Service</Label>
                    <Select
                      value={sr.serviceId.toString()}
                      onValueChange={(value) =>
                        updateServiceRequest(index, 'serviceId', parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name} ({service.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {service && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={sr.priority}
                      onValueChange={(value) => updateServiceRequest(index, 'priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={sr.notes || ''}
                      onChange={(e) => updateServiceRequest(index, 'notes', e.target.value)}
                      placeholder="Any additional context for this service request"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            );
          })}

          <Button onClick={addServiceRequest} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Service Request
          </Button>
        </div>
      )}

      <WizardNavigation />
    </div>
  );
}
