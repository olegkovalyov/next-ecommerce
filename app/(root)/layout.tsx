import Header from '@/presentation/components/shared/header';
import Footer from '@/presentation/components/footer';
import { ReactElement } from 'react';

export default function RootLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>): ReactElement {

  return (
    <div className="flex h-screen flex-col">
      <Header/>
      <main className="flex-1 wrapper">{children}</main>
      <Footer/>
    </div>
  );
}
