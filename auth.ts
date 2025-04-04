// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts-edge';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/db/prisma';
import { CartSyncService } from '@/infrastructure/services/cart-sync.service';
import { cookies } from 'next/headers';

export const config = {
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
    async session({ session, token }: Record<unknown, unknown>) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      return session;
    },
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async jwt({ token, user }: Record<unknown, unknown>) {
      // Assign user fields to token
      if (user) {
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === '') {
          token.name = user.email!.split('@')[0];

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      try {
        const userId = String(user.id);
        await CartSyncService.syncGuestCartToUser(userId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sync cart:', error);
        // Continue with the request even if sync fails
      }
    },
    async signOut() {
      const cookieStore = await cookies();
      cookieStore.delete('guest_cart');
      // eslint-disable-next-line no-console
      console.log('Signed out');
      // Handle sign out
    },
  },
} satisfies NextAuthConfig;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const { handlers, auth, signIn, signOut } = NextAuth(config);
