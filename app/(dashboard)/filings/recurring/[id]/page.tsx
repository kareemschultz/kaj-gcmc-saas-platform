import { RecurringFilingForm } from '@/components/recurring-filings/recurring-filing-form';
import { getRecurringFiling, deleteRecurringFiling } from '@/lib/actions/recurring-filings';
import { getFilingTypes, getClientsForFilingSelect } from '@/lib/actions/filings';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DeleteButton } from './delete-button';

export default async function EditRecurringFilingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const id = parseInt(params.id);

  const [recurringFiling, filingTypes, clients, clientBusinesses] = await Promise.all([
    getRecurringFiling(id),
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/filings/recurring">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Recurring Filing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update recurring filing schedule
            </p>
          </div>
        </div>
        <DeleteButton id={id} />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-lg border bg-card p-6">
          <RecurringFilingForm
            recurringFiling={recurringFiling}
            filingTypes={filingTypes}
            clients={clients}
            clientBusinesses={clientBusinesses}
          />
        </div>
      </div>
    </div>
  );
}
