// Session and authentication types

import { UserRole, TenantContext, UserContext } from './index';

export interface Session {
  user: {
    id: number;
    email: string;
    name: string;
    image?: string | null;
  };
  tenant?: TenantContext;
  role?: UserRole;
  expires: string;
}

export interface AuthUser extends UserContext {
  avatarUrl?: string | null;
  phone?: string | null;
}
