import { Metadata } from 'next';
import Link from 'next/link';
import { getPortalServiceRequests } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Briefcase, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Service Requests | Client Portal',
};

export default async function PortalServicesPage() {
  const clientId = 1; // From session in real app
  const serviceRequests = await getPortalServiceRequests(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Requests</h1>
        <p className="text-muted-foreground mt-1">
          Track the progress of your compliance services
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{serviceRequests.length}</div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {serviceRequests.filter((sr) => sr.status === 'in_progress').length}
          </div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">
            {serviceRequests.filter((sr) => sr.status === 'awaiting_client').length}
          </div>
          <div className="text-sm text-muted-foreground">Awaiting You</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {serviceRequests.filter((sr) => sr.status === 'completed').length}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
      </div>

      {/* Service Requests List */}
      <div className="grid gap-4">
        {serviceRequests.map((sr) => {
          const completedSteps = sr.steps.filter((s) => s.status === 'done').length;
          const totalSteps = sr.steps.length;
          const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <Card key={sr.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{sr.service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sr.service.category}
                      {sr.service.description && ` • ${sr.service.description}`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    sr.status === 'awaiting_client'
                      ? 'destructive'
                      : sr.status === 'completed'
                      ? 'default'
                      : 'outline'
                  }
                  className={sr.status === 'completed' ? 'bg-green-600' : ''}
                >
                  {sr.status.replace('_', ' ')}
                </Badge>
              </div>

              {totalSteps > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {completedSteps} of {totalSteps} steps completed
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(sr.createdAt).toLocaleDateString()}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/portal/services/${sr.id}`}>
                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {serviceRequests.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No service requests found</p>
        </Card>
      )}
    </div>
  );
}
