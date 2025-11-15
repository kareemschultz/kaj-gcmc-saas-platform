'use client';

import { useWizard } from '@/components/wizard/wizard-context';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NewClientWizardData } from '@/lib/actions/wizards';
import { CheckCircle2, Building2, FileCheck, Briefcase } from 'lucide-react';

interface ReviewAndConfirmStepProps {
  bundles: any[];
  services: any[];
  isSubmitting: boolean;
}

export function ReviewAndConfirmStep({
  bundles,
  services,
  isSubmitting,
}: ReviewAndConfirmStepProps) {
  const { state } = useWizard<NewClientWizardData>();
  const data = state.data;

  const selectedBundles = bundles.filter((b) => data.selectedBundleIds?.includes(b.id));
  const selectedServices = services.filter((s) =>
    data.initialServiceRequests?.some((sr) => sr.serviceId === s.id)
  );

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <p className="text-sm text-teal-800 font-medium">
            Review all details before completing the onboarding
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          Client Information
        </h3>
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-base">{data.name}</dd>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Type</dt>
              <dd>
                <Badge>{data.type}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Risk Level</dt>
              <dd>
                <Badge
                  variant={
                    data.riskLevel === 'high'
                      ? 'destructive'
                      : data.riskLevel === 'medium'
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {data.riskLevel}
                </Badge>
              </dd>
            </div>
          </div>
          {data.email && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-base">{data.email}</dd>
            </div>
          )}
          {data.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd className="text-base">{data.phone}</dd>
            </div>
          )}
          {data.tin && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">TIN</dt>
              <dd className="text-base">{data.tin}</dd>
            </div>
          )}
          {data.nisNumber && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">NIS Number</dt>
              <dd className="text-base">{data.nisNumber}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Businesses */}
      {data.businesses && data.businesses.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Business Entities ({data.businesses.length})
          </h3>
          <div className="space-y-3">
            {data.businesses.map((business, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{business.name}</div>
                {business.registrationNumber && (
                  <div className="text-sm text-muted-foreground">
                    Reg: {business.registrationNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Compliance Bundles */}
      {selectedBundles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600" />
            Compliance Bundles ({selectedBundles.length})
          </h3>
          <div className="space-y-2">
            {selectedBundles.map((bundle) => (
              <div key={bundle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{bundle.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {bundle.authority} • {bundle.items.length} requirements
                  </div>
                </div>
                <Badge variant="outline">{bundle.category}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Service Requests */}
      {data.initialServiceRequests && data.initialServiceRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            Initial Service Requests ({data.initialServiceRequests.length})
          </h3>
          <div className="space-y-2">
            {data.initialServiceRequests.map((sr, index) => {
              const service = services.find((s) => s.id === sr.serviceId);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{service?.name}</div>
                    {sr.notes && (
                      <div className="text-sm text-muted-foreground">{sr.notes}</div>
                    )}
                  </div>
                  <Badge
                    variant={
                      sr.priority === 'urgent' || sr.priority === 'high'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {sr.priority}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <WizardNavigation completeLabel="Create Client" nextDisabled={isSubmitting} />
    </div>
  );
}
