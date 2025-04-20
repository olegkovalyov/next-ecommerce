'use client';

import { type ReactNode } from 'react';
import { toast } from 'sonner';

interface ShowToastOptions {
  description?: string | ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  return {
    toast: (title: string | ReactNode, options?: ShowToastOptions) => {
      return toast(title, {
        description: options?.description,
        action: options?.action
          ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
          : undefined,
      });
    },
    success: (title: string | ReactNode, options?: ShowToastOptions) => {
      return toast.success(title, {
        description: options?.description,
        position: 'top-center',
        action: options?.action
          ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
          : undefined,
      });
    },
    error: (title: string | ReactNode, options?: ShowToastOptions) => {
      return toast.error(title, {
        description: options?.description,
        position: 'top-center',
        action: options?.action
          ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
          : undefined,
      });
    },
    dismiss: toast.dismiss,
  };
}
