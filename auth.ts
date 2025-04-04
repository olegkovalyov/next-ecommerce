import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts-edge';
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
    async session({ session, token }: any) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      return session;
    },
    async jwt({ token, user }: any) {
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
    async signIn({ user, account, profile }) {
      try {
        const userId = String(user.id);
        await CartSyncService.syncGuestCartToUser(userId);
      } catch (error) {
        console.error('Failed to sync cart:', error);
        // Continue with the request even if sync fails
      }
    },
    async signOut() {
      const cookieStore = await cookies();
      cookieStore.delete('guest_cart');
      console.log('Signed out');
      // Handle sign out
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
