'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ServiceRequestWizardData } from '@/src/lib/actions/wizards';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface SelectClientStepProps {
  clients: any[];
}

export function SelectClientStep({ clients }: SelectClientStepProps) {
  const { state, updateData } = useWizard<ServiceRequestWizardData>();
  const data = state.data;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectClient = (clientId: number) => {
    updateData({ clientId });
  };

  const handleNext = () => {
    if (!data.clientId || data.clientId === 0) {
      alert('Please select a client');
      return false;
    }
    return true;
  };

  const selectedClient = clients.find((c) => c.id === data.clientId);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Select the client for this service request. You can search by name.
        </p>
      </div>

      {/* Search */}
      <div>
        <Label htmlFor="search">Search Clients</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Client Display */}
      {selectedClient && (
        <Card className="p-4 bg-teal-50 border-teal-600">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-lg">{selectedClient.name}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{selectedClient.type}</Badge>
                {selectedClient.sector && (
                  <Badge variant="outline">{selectedClient.sector}</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Client List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No clients found matching "{searchTerm}"
          </div>
        ) : (
          filteredClients.map((client) => {
            const isSelected = client.id === data.clientId;

            return (
              <Card
                key={client.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'border-teal-600 bg-teal-50' : 'hover:border-gray-400'
                }`}
                onClick={() => selectClient(client.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {client.type}
                      </Badge>
                      {client.sector && (
                        <Badge variant="outline" className="text-xs">
                          {client.sector}
                        </Badge>
                      )}
                    </div>
                    {client.email && (
                      <div className="text-sm text-muted-foreground mt-1">{client.email}</div>
                    )}
                  </div>
                  {isSelected && (
                    <Badge className="bg-teal-600">Selected</Badge>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
