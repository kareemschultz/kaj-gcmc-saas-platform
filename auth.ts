// NextAuth v5 configuration with multi-tenant support

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              tenantUsers: {
                include: {
                  tenant: true,
                  role: true,
                },
              },
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Validate user has tenant associations
          if (!user.tenantUsers || user.tenantUsers.length === 0) {
            console.error('User has no tenant associations', { userId: user.id });
            return null;
          }

          // Return user with first tenant (user will select tenant after login if multiple)
          const primaryTenantUser = user.tenantUsers[0];

          // Validate primary tenant user has required data
          if (!primaryTenantUser.tenantId || !primaryTenantUser.tenant) {
            console.error('Invalid tenant association', { userId: user.id });
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
            tenantId: primaryTenantUser.tenantId,
            tenantCode: primaryTenantUser.tenant.code,
            tenantName: primaryTenantUser.tenant.name,
            role: primaryTenantUser.role?.name || 'user',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.tenantCode = user.tenantCode;
        token.tenantName = user.tenantName;
        token.role = user.role;
      }

      // Handle tenant switching
      if (trigger === 'update' && session?.tenantId) {
        token.tenantId = session.tenantId;
        token.tenantCode = session.tenantCode;
        token.tenantName = session.tenantName;
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Validate and parse user ID
        if (!token.id || typeof token.id !== 'string') {
          throw new Error('Invalid token: missing user ID');
        }

        const userId = parseInt(token.id, 10);
        if (isNaN(userId) || userId <= 0) {
          throw new Error('Invalid user ID in token');
        }

        session.user.id = userId;

        // Only set tenant if we have valid tenant data
        if (token.tenantId && token.tenantCode && token.tenantName) {
          session.tenant = {
            tenantId: token.tenantId as number,
            tenantCode: token.tenantCode as string,
            tenantName: token.tenantName as string,
          };
        }

        session.role = token.role as string || 'user';
      }

      return session;
    },
  },
});
