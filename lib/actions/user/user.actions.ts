'use server';

import { db } from '@/infrastructure/db';
import { ShippingAddress } from '@/lib/contracts/shipping-address';
import { auth } from '@/infrastructure/auth/auth';
import { shippingAddressSchema } from '@/lib/validators/shipping-address.validator';
import { formatError } from '@/lib/utils';
import { paymentMethodSchema } from '@/lib/validators/payment-method.validator';
import { z } from 'zod';
import * as schema from '@/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserById(userId: string): Promise<Record<string, unknown>> {
  const users = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
  if (!users.length) throw new Error('User not found');
  return users[0];
}

export async function updateUserAddress(data: ShippingAddress): Promise<Record<string, unknown>> {
  try {
    const session = await auth();

    if (!session?.user?.id) throw new Error('User not authenticated');

    const users = await db.select().from(schema.user).where(eq(schema.user.id, session.user.id)).limit(1);
    if (!users.length) throw new Error('User not found');

    const address = shippingAddressSchema.parse(data);

    await db.update(schema.user)
      .set({ address: JSON.stringify(address) })
      .where(eq(schema.user.id, session.user.id));

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>,
): Promise<Record<string, unknown>> {
  try {
    const session = await auth();

    if (!session?.user?.id) throw new Error('User not authenticated');

    const users = await db.select().from(schema.user).where(eq(schema.user.id, session.user.id)).limit(1);
    if (!users.length) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await db.update(schema.user)
      .set({ payment_method: paymentMethod.type })
      .where(eq(schema.user.id, session.user.id));

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
