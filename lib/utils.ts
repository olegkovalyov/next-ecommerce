import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ZodError } from 'zod';

// import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split('.');
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}

class RedirectError extends Error {
}

type PrismaClientKnownRequestError = {
  code: string;
  clientVersion?: string;
  meta?: Record<string, any>;
  message: string;
  name: 'PrismaClientKnownRequestError';
};

export function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    // Handle Zod validation error
    return 'Validation failed: ' + error.errors.map((e) => e.message).join(', ');
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'name' in error &&
    error.name === 'PrismaClientKnownRequestError'
  ) {
    const prismaError = error as PrismaClientKnownRequestError;

    // Handle known Prisma errors, e.g., duplicate entries
    if (prismaError.code === 'P2002') {
      return 'Email already exists';
    }
    return 'Database error: ' + prismaError.message;
  }

  if (error instanceof RedirectError) {
    // Handle redirect errors
    return 'Redirect error occurred';
  }

  if (error instanceof Error) {
    // Handle any unexpected errors
    return 'An unexpected error occurred: ' + error.message;
  }

  // If the error doesn't match any known types
  return 'An unknown error occurred';
}
