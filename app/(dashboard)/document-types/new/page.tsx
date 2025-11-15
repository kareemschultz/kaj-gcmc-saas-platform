import { DocumentTypeForm } from '@/components/document-types/document-type-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewDocumentTypePage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Document Type</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define a new document type for your organization
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
        <DocumentTypeForm />
      </div>
    </div>
  );
}
