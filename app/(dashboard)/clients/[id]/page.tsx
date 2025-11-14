// Client detail page

import { getClient } from '@/lib/actions/clients';
import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ClientDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const clientId = parseInt(params.id);
  
  if (isNaN(clientId)) {
    notFound();
  }

  let client;
  try {
    client = await getClient(clientId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit client details
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-lg border bg-card p-6">
          <ClientForm client={client} />
        </div>
      </div>
    </div>
  );
}
