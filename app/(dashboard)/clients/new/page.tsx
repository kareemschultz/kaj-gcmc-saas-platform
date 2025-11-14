// Create new client page

import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Client</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a new client to the system
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border bg-card p-6">
          <ClientForm />
        </div>
      </div>
    </div>
  );
}
