import { getFilingType } from '@/lib/actions/filing-types';
import { FilingTypeForm } from '@/components/filing-types/filing-type-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditFilingTypePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  try {
    const filingType = await getFilingType(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Filing Type</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {filingType.name} details
            </p>
          </div>
          <Link
            href="/filing-types"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Filing Types
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <FilingTypeForm filingType={filingType} />
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Filings</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {filingType._count.filings}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(filingType.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
