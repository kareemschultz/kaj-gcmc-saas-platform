import { getDocumentType } from '@/src/lib/actions/document-types';
import { DocumentTypeForm } from '@/components/document-types/document-type-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditDocumentTypePage({
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
    const documentType = await getDocumentType(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Document Type</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update {documentType.name} details
            </p>
          </div>
          <Link
            href="/document-types"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Document Types
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <DocumentTypeForm documentType={documentType} />
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Documents</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {documentType._count.documents}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(documentType.createdAt).toLocaleDateString()}
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
