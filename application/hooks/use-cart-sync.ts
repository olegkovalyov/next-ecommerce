'use client';

import { useEffect, useRef } from 'react';
import { CartDto } from '@/domain/dtos';

interface UseCartSyncReturn {
  debouncedSyncCart: (cartDto: CartDto) => void;
}

export function useCartSync(): UseCartSyncReturn {
  const debounceTimerRef = useRef(0);
  const isMountedRef = useRef(true); // Добавляем флаг

  function debouncedSyncCart(cart: CartDto) {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        await fetch('/api/cart/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cart),
        });
      } catch (error) {
        console.error('Cart sync error:', error);
      }
    }, 1000);
  }

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    debouncedSyncCart,
  };
}
