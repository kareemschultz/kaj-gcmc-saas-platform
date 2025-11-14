'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ServiceRequestWizardData } from '@/lib/actions/wizards';
import { DollarSign, Clock } from 'lucide-react';

interface SelectServiceStepProps {
  services: any[];
}

export function SelectServiceStep({ services }: SelectServiceStepProps) {
  const { state, updateData } = useWizard<ServiceRequestWizardData>();
  const data = state.data;

  // Group services by category
  const servicesByCategory: Record<string, any[]> = {};
  services.forEach((service) => {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = [];
    }
    servicesByCategory[service.category].push(service);
  });

  const selectService = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    // Auto-select template if only one exists
    const templateId = service?.templates?.length === 1 ? service.templates[0].id : undefined;
    updateData({ serviceId, templateId });
  };

  const handleNext = () => {
    if (!data.serviceId || data.serviceId === 0) {
      alert('Please select a service');
      return false;
    }
    return true;
  };

  const selectedService = services.find((s) => s.id === data.serviceId);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Select the service you want to provide to this client. You can also set priority and add
          notes.
        </p>
      </div>

      {/* Service Selection */}
      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category}>
          <h3 className="font-semibold text-lg mb-3 text-teal-700">{category}</h3>
          <div className="grid gap-3">
            {categoryServices.map((service) => {
              const isSelected = service.id === data.serviceId;

              return (
                <Card
                  key={service.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-teal-600 bg-teal-50' : 'hover:border-gray-400'
                  }`}
                  onClick={() => selectService(service.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{service.name}</div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        {service.basePrice && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              GYD {service.basePrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {service.estimatedDays && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.estimatedDays} days</span>
                          </div>
                        )}
                        {service.templates && service.templates.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {service.templates.length} template(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && <Badge className="bg-teal-600">Selected</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Additional Options */}
      {selectedService && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Service Details</h3>

          <div className="space-y-4">
            {/* Template Selection */}
            {selectedService.templates && selectedService.templates.length > 0 && (
              <div>
                <Label>Workflow Template (Optional)</Label>
                <Select
                  value={data.templateId?.toString() || ''}
                  onValueChange={(value) =>
                    updateData({ templateId: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or configure manually" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template (manual steps)</SelectItem>
                    {selectedService.templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority */}
            <div>
              <Label>Priority</Label>
              <Select
                value={data.priority || 'medium'}
                onValueChange={(value) => updateData({ priority: value })}
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

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={data.notes || ''}
                onChange={(e) => updateData({ notes: e.target.value })}
                placeholder="Any additional context for this service request"
                rows={4}
              />
            </div>
          </div>
        </Card>
      )}

      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
