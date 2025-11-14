import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, FileText, User, Briefcase, Calendar, Trash, Edit } from 'lucide-react';
import { RecentActivity } from '@/src/lib/actions/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityCardProps {
  activities: RecentActivity[];
}

const actionIcons: Record<string, any> = {
  create: FileText,
  update: Edit,
  delete: Trash,
  submit: Calendar,
};

const actionColors: Record<string, string> = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
  submit: 'text-teal-600',
};

const entityIcons: Record<string, any> = {
  Client: User,
  Filing: FileText,
  Document: FileText,
  ServiceRequest: Briefcase,
  Task: Calendar,
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions across your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.action] || Activity;
              const EntityIcon = entityIcons[activity.entityType] || FileText;
              const actionColor = actionColors[activity.action] || 'text-muted-foreground';

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`mt-0.5 ${actionColor}`}>
                    <ActionIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.actor}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.action}d</span>
                          {' '}
                          <span className="font-medium">{activity.entityType.toLowerCase()}</span>
                          {activity.clientName && (
                            <>
                              {' '}
                              <span className="text-muted-foreground">for</span>
                              {' '}
                              <span className="font-medium">{activity.clientName}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <EntityIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
