'use server';

import { signIn, signOut } from '@/auth';
import { hashSync } from 'bcrypt-ts-edge';
import { prisma } from '@/db/prisma';
import { signInFormSchema, signUpFormSchema } from '@/lib/validators/auth.validator';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { formatError } from '@/lib/utils';

type SignInResponse = {
  success: boolean;
  message: string;
  email: string;
  password: string;
};

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData,
): Promise<SignInResponse> {
  const user = signInFormSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  try {
    await signIn('credentials', user);

    return {
      success: true,
      message: 'Signed in successfully',
      email: user.email,
      password: user.password,
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      message: 'Invalid email or password',
      email: user.email,
      password: user.password,
    };
  }
}

// Sign user out
export async function signOutUser(): Promise<void> {
  await signOut();
}

type SignUpResponse = {
  success: boolean;
  message: string;
};

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData): Promise<SignUpResponse> {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;

    user.password = hashSync(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: 'User registered successfully' };
  } catch (error: unknown) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
