'use client';

import React, { ReactElement, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/presentation/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import { CartDto } from '@/domain/dtos';
import { useCartStore } from '@/store/cart.store';

interface ClientLayoutProps {
  children: React.ReactNode;
  cartDto: CartDto | null;
  isLogged: boolean;
}

export default function ClientLayout({ children, isLogged, cartDto }: Readonly<ClientLayoutProps>): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const { setAuthenticated } = useAuthStore();
  const { setCartDto } = useCartStore();

  useEffect(() => {
    if (cartDto) {
      console.log('set cart dto');
      setCartDto(cartDto);
    }
  }, [cartDto, setCartDto]);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isLogged);
  }, [isLogged, setAuthenticated]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
