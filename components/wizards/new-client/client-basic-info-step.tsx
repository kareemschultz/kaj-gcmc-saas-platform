'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewClientWizardData } from '@/src/lib/actions/wizards';

export function ClientBasicInfoStep() {
  const { state, updateData } = useWizard<NewClientWizardData>();
  const data = state.data;

  const handleNext = () => {
    // Validate required fields
    if (!data.name || !data.type) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Client Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">
            Client Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Enter client name"
            required
          />
        </div>

        {/* Client Type */}
        <div>
          <Label htmlFor="type">
            Client Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.type}
            onValueChange={(value: any) => updateData({ type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Level */}
        <div>
          <Label htmlFor="riskLevel">Risk Level</Label>
          <Select
            value={data.riskLevel || 'medium'}
            onValueChange={(value: any) => updateData({ riskLevel: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="client@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+592-XXX-XXXX"
          />
        </div>

        {/* TIN */}
        <div>
          <Label htmlFor="tin">TIN (Tax Identification Number)</Label>
          <Input
            id="tin"
            value={data.tin || ''}
            onChange={(e) => updateData({ tin: e.target.value })}
            placeholder="GRA TIN"
          />
        </div>

        {/* NIS Number */}
        <div>
          <Label htmlFor="nisNumber">NIS Number</Label>
          <Input
            id="nisNumber"
            value={data.nisNumber || ''}
            onChange={(e) => updateData({ nisNumber: e.target.value })}
            placeholder="NIS registration number"
          />
        </div>

        {/* Sector */}
        <div>
          <Label htmlFor="sector">Sector/Industry</Label>
          <Input
            id="sector"
            value={data.sector || ''}
            onChange={(e) => updateData({ sector: e.target.value })}
            placeholder="e.g., Retail, Construction, Healthcare"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={data.address || ''}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="Full address"
            rows={3}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={data.notes || ''}
            onChange={(e) => updateData({ notes: e.target.value })}
            placeholder="Any additional information about this client"
            rows={3}
          />
        </div>
      </div>

      <WizardNavigation onNext={handleNext} />
    </div>
  );
}
