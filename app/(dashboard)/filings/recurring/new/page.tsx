import { RecurringFilingForm } from '@/components/recurring-filings/recurring-filing-form';
import { getFilingTypes, getClientsForFilingSelect } from '@/src/lib/actions/filings';
import { prisma } from '@/src/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewRecurringFilingPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const [filingTypes, clients, clientBusinesses] = await Promise.all([
    getFilingTypes(),
    getClientsForFilingSelect(),
    prisma.clientBusiness.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        clientId: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/filings/recurring">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Recurring Filing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new recurring filing schedule
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-lg border bg-card p-6">
          <RecurringFilingForm
            filingTypes={filingTypes}
            clients={clients}
            clientBusinesses={clientBusinesses}
          />
        </div>
      </div>
    </div>
  );
}
