// Auth error page

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Authentication Error | KGC Compliance Cloud',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-destructive">Authentication Error</h1>
        <p className="mt-4 text-muted-foreground">
          {error === 'Configuration'
            ? 'There is a problem with the server configuration.'
            : error === 'AccessDenied'
            ? 'You do not have permission to access this resource.'
            : error === 'Verification'
            ? 'The verification token has expired or has already been used.'
            : 'An error occurred during authentication.'}
        </p>
        
        <Button asChild className="mt-6">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
