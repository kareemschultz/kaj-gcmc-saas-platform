'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NewClientWizardData } from '@/src/lib/actions/wizards';
import { Plus, Trash2 } from 'lucide-react';

export function ClientBusinessesStep() {
  const { state, updateData } = useWizard<NewClientWizardData>();
  const data = state.data;
  const businesses = data.businesses || [];

  const addBusiness = () => {
    updateData({
      businesses: [
        ...businesses,
        {
          name: '',
          registrationNumber: '',
          registrationType: 'Company',
          country: 'Guyana',
          status: 'active',
        },
      ],
    });
  };

  const removeBusiness = (index: number) => {
    const updated = businesses.filter((_, i) => i !== index);
    updateData({ businesses: updated });
  };

  const updateBusiness = (index: number, field: string, value: string) => {
    const updated = businesses.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    updateData({ businesses: updated });
  };

  return (
    <div className="space-y-6">
      {data.type === 'individual' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This step is optional for individual clients. You can skip to the next step or add
            any businesses associated with this individual.
          </p>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No businesses added yet</p>
          <Button onClick={addBusiness} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Business Entity
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium">Business {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBusiness(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={business.name}
                    onChange={(e) => updateBusiness(index, 'name', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <Label>Registration Number</Label>
                  <Input
                    value={business.registrationNumber || ''}
                    onChange={(e) => updateBusiness(index, 'registrationNumber', e.target.value)}
                    placeholder="DCRA or other reg number"
                  />
                </div>

                <div>
                  <Label>Registration Type</Label>
                  <Input
                    value={business.registrationType || ''}
                    onChange={(e) => updateBusiness(index, 'registrationType', e.target.value)}
                    placeholder="e.g., Company, LLC, Partnership"
                  />
                </div>

                <div>
                  <Label>Incorporation Date</Label>
                  <Input
                    type="date"
                    value={business.incorporationDate || ''}
                    onChange={(e) => updateBusiness(index, 'incorporationDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Country</Label>
                  <Input
                    value={business.country || 'Guyana'}
                    onChange={(e) => updateBusiness(index, 'country', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Sector</Label>
                  <Input
                    value={business.sector || ''}
                    onChange={(e) => updateBusiness(index, 'sector', e.target.value)}
                    placeholder="e.g., Retail, Construction"
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button onClick={addBusiness} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Business
          </Button>
        </div>
      )}

      <WizardNavigation />
    </div>
  );
}
