import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import ClientLayout from '@/app/client-layout';
import { ReactElement } from 'react';
import { auth } from '@/infrastructure/auth/auth';
import { sync as syncCart } from '@/lib/actions/cart/sync';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: `%s | Modern fashion`,
    default: String(APP_NAME),
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(String(SERVER_URL)),
};

export default async function RootLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>): Promise<ReactElement> {

  const session = await auth();
  const isLogged = session?.user !== undefined;

  let cartDto = null;
  const syncCartResult = await syncCart();
  if (syncCartResult.success) {
    cartDto = syncCartResult.value;
  }

  return (
    <html lang="en">
    <head>
      <link rel="icon" href="/favicon.ico" />
    </head>
    <body className={`${inter.className} antialiased`} suppressHydrationWarning>
    <ClientLayout isLogged={isLogged} cartDto={cartDto}>
      {children}
    </ClientLayout>
    </body>
    </html>
  );
}
