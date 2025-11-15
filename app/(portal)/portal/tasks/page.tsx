import { Metadata } from 'next';
import { getPortalClientTasks } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListTodo, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tasks | Client Portal',
};

export default async function PortalTasksPage() {
  const clientId = 1; // From session in real app
  const tasks = await getPortalClientTasks(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Action items and requests that require your attention
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-2xl font-bold">{tasks.length}</div>
          <div className="text-sm text-muted-foreground">Total Tasks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter((t: any) => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter((t: any) => t.status === 'completed').length}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task: any) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          const isOverdue = dueDate && dueDate < new Date();

          return (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <ListTodo className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {task.serviceRequest && (
                        <Badge variant="outline" className="text-xs">
                          {task.serviceRequest.service.name}
                        </Badge>
                      )}
                      {dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${
                          isOverdue ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>Due: {dueDate.toLocaleDateString()}</span>
                          {isOverdue && <span className="font-medium">(Overdue)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    task.status === 'completed'
                      ? 'default'
                      : task.status === 'in_progress'
                      ? 'outline'
                      : 'secondary'
                  }
                  className={task.status === 'completed' ? 'bg-green-600' : ''}
                >
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No tasks assigned</p>
        </Card>
      )}
    </div>
  );
}
