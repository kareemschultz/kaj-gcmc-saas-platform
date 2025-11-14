import { Metadata } from 'next';
import { getPortalClientProfile } from '@/src/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile | Client Portal',
};

export default async function PortalProfilePage() {
  const clientId = 1; // From session in real app
  const client = await getPortalClientProfile(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your account information and business details
        </p>
      </div>

      {/* Client Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          Client Information
        </h2>

        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-1">Name</dt>
            <dd className="text-base">{client.name}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-1">Type</dt>
            <dd>
              <Badge>{client.type}</Badge>
            </dd>
          </div>

          {client.email && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </dt>
              <dd className="text-base">{client.email}</dd>
            </div>
          )}

          {client.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone
              </dt>
              <dd className="text-base">{client.phone}</dd>
            </div>
          )}

          {client.address && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Address
              </dt>
              <dd className="text-base">{client.address}</dd>
            </div>
          )}

          {client.tin && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">TIN</dt>
              <dd className="text-base font-mono">{client.tin}</dd>
            </div>
          )}

          {client.nisNumber && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">NIS Number</dt>
              <dd className="text-base font-mono">{client.nisNumber}</dd>
            </div>
          )}

          {client.sector && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Sector</dt>
              <dd className="text-base">{client.sector}</dd>
            </div>
          )}

          {client.riskLevel && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Risk Level</dt>
              <dd>
                <Badge
                  variant={
                    client.riskLevel === 'high'
                      ? 'destructive'
                      : client.riskLevel === 'medium'
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {client.riskLevel}
                </Badge>
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Business Entities */}
      {client.businesses && client.businesses.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Business Entities
          </h2>

          <div className="space-y-4">
            {client.businesses.map((business: any) => (
              <div key={business.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-lg">{business.name}</div>
                <dl className="grid gap-2 mt-3 text-sm">
                  {business.registrationNumber && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Registration Number:</dt>
                      <dd className="font-medium font-mono">{business.registrationNumber}</dd>
                    </div>
                  )}
                  {business.registrationType && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type:</dt>
                      <dd className="font-medium">{business.registrationType}</dd>
                    </div>
                  )}
                  {business.sector && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sector:</dt>
                      <dd className="font-medium">{business.sector}</dd>
                    </div>
                  )}
                  {business.status && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd>
                        <Badge variant="outline">{business.status}</Badge>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </Card>
      )}

      {client.notes && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p className="text-muted-foreground">{client.notes}</p>
        </Card>
      )}
    </div>
  );
}
