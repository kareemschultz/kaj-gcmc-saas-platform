// Extend NextAuth types for multi-tenant support

import { DefaultSession } from 'next-auth';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
    } & DefaultSession['user'];
    tenant?: {
      tenantId: number;
      tenantCode: string;
      tenantName: string;
    };
    role?: string;
  }

  interface User {
    id: string;
    tenantId?: number;
    tenantCode?: string;
    tenantName?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tenantId?: number;
    tenantCode?: string;
    tenantName?: string;
    role?: string;
  }
}
