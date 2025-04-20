'use client';

import { signOutUser } from '@/lib/actions/auth.actions';
import { Button } from '@/presentation/components/ui/button';
import { ReactElement } from 'react';
import { useCartStore } from '@/store/cart.store';

export const SignOutButton = (): ReactElement => {
  const { clearCart } = useCartStore();
  const handleSignOut = async () => {
    clearCart();
    await signOutUser();
  };

  return (
    <>
      <form action={handleSignOut} className="w-full">
        <Button
          className="w-full py-4 px-2 h-4 justify-start"
          variant="ghost"
        >
          Sign Out
        </Button>
      </form>
    </>
  );
};

