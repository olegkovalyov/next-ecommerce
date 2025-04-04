import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import ClientLayout from '@/app/client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: `%s | Modern fashion`,
    default: String(APP_NAME),
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(String(SERVER_URL)),
};

export default function RootLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
    <head>
      <link rel="icon" href="/favicon.ico" />
    </head>
    <body className={`${inter.className} antialiased`} suppressHydrationWarning>
    <ClientLayout>
      {children}
    </ClientLayout>
    </body>
    </html>
  );
}
