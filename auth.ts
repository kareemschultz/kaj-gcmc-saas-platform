// NextAuth v5 configuration with multi-tenant support

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './src/lib/prisma';
import { loginSchema } from './src/lib/validation';

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

          // Return user with first tenant (user will select tenant after login if multiple)
          const primaryTenantUser = user.tenantUsers[0];

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
            tenantId: primaryTenantUser?.tenantId,
            tenantCode: primaryTenantUser?.tenant?.code,
            tenantName: primaryTenantUser?.tenant?.name,
            role: primaryTenantUser?.role?.name,
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
        session.user.id = parseInt(token.id as string);
        session.tenant = {
          tenantId: token.tenantId as number,
          tenantCode: token.tenantCode as string,
          tenantName: token.tenantName as string,
        };
        session.role = token.role as string;
      }

      return session;
    },
  },
});
