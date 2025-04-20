// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts-edge';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/infrastructure/prisma/prisma';
import { cookies } from 'next/headers';

export const config: NextAuthConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) {
          return null;
        }

        // Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // Check if user exists and if the password matches
        if (
          user
          && user.password
        ) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password,
          );

          // If password is correct, return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // If user does not exist or password does not match return null
        return null;
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async session({ session, token }: Record<unknown, unknown>): Promise<Record<unknown, unknown>> {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      return session;
    },
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async jwt({ token, user }: Record<unknown, unknown>): Promise<Record<unknown, unknown>> {
      // Assign user fields to token
      if (user) {
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === '') {
          token.name = user.email.split('@')[0];

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }
      }
      return token;
    },
  },
  events: {
    async signIn({ user }): Promise<void> {
      try {
        console.log(user.id);
        // const userId = String(user.id);
        // await (await CartSyncService.create(userId)).syncGuestCartToUser();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sync cart:', error);
        // Continue with the request even if sync fails
      }
    },
    async signOut(): Promise<void> {
      // eslint-disable-next-line no-console
      console.log('Signed out');
      // Handle sign out
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
