// API route for requirement bundle progress

import { NextRequest, NextResponse } from 'next/server';
import { checkBundleProgress } from '@/src/lib/actions/requirement-bundles';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bundleId = parseInt(params.id, 10);
    if (isNaN(bundleId)) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 });
    }

    // Get clientId from query params
    const searchParams = request.nextUrl.searchParams;
    const clientIdParam = searchParams.get('clientId');

    if (!clientIdParam) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const clientId = parseInt(clientIdParam, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const progress = await checkBundleProgress(clientId, bundleId);

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching bundle progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
