// Next.js middleware for authentication and tenant context
// NOTE: Middleware is disabled to avoid NextAuth Edge Runtime issues
// Auth checks are performed at the page level using auth() in each page component

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Minimal middleware - auth checks happen in page components
  // This avoids NextAuth dynamic code evaluation issues in Edge Runtime
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
