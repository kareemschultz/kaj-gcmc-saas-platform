// Next.js middleware for authentication and tenant context

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

const publicPaths = ['/auth/login', '/auth/register', '/auth/error', '/api/auth'];
const authPaths = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check tenant context for protected routes
  if (pathname.startsWith('/dashboard') && !session.user.tenantId) {
    return NextResponse.redirect(new URL('/select-tenant', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};
