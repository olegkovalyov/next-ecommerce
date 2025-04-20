import { ReactElement } from 'react';

export default function AuthLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>): ReactElement {
  return <div className="flex-center min-h-screen w-full">{children}</div>;
}
