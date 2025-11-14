'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, updateTask, taskSchema, type TaskFormData } from '@/src/lib/actions/tasks';
import { getUsers } from '@/src/lib/actions/users';
import { getClients } from '@/src/lib/actions/clients';
import { toast } from '@/hooks/use-toast';
import type { Task, User, Client } from '@prisma/client';

interface TaskFormProps {
  task?: Task & {
    assignedTo?: User | null;
    client?: Client | null;
  };
}

export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
      title: task.title,
      description: task.description || undefined,
      status: task.status as any,
      priority: task.priority as any || undefined,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : undefined,
      assignedToId: task.assignedToId || undefined,
      clientId: task.clientId || undefined,
      serviceRequestId: task.serviceRequestId || undefined,
      filingId: task.filingId || undefined,
    } : {
      status: 'open',
    },
  });

  const status = watch('status');
  const priority = watch('priority');
  const assignedToId = watch('assignedToId');
  const clientId = watch('clientId');

  // Load users and clients
  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, clientsData] = await Promise.all([
          getUsers({ pageSize: 100 }),
          getClients({ pageSize: 100 }),
        ]);
        setUsers(usersData.users);
        setClients(clientsData.clients);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users and clients.',
          variant: 'destructive',
        });
      } finally {
        setLoadingUsers(false);
        setLoadingClients(false);
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      if (task) {
        await updateTask(task.id, data);
        toast({
          title: 'Task updated',
          description: 'Task has been updated successfully.',
        });
      } else {
        await createTask(data);
        toast({
          title: 'Task created',
          description: 'New task has been created successfully.',
        });
      }
      router.push('/tasks');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save task.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter task title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter task description"
            rows={4}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority || ''} onValueChange={(value) => setValue('priority', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="mt-1 text-sm text-destructive">{errors.priority.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="assignedToId">Assigned To</Label>
            <Select
              value={assignedToId?.toString() || ''}
              onValueChange={(value) => setValue('assignedToId', value ? parseInt(value) : undefined)}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? "Loading..." : "Select user"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedToId && (
              <p className="mt-1 text-sm text-destructive">{errors.assignedToId.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select
            value={clientId?.toString() || ''}
            onValueChange={(value) => setValue('clientId', value ? parseInt(value) : undefined)}
            disabled={loadingClients}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingClients ? "Loading..." : "Select client"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && (
            <p className="mt-1 text-sm text-destructive">{errors.clientId.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/tasks')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
