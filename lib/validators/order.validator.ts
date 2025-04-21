// Schema for inserting order
import { z } from 'zod';
import { currency } from '@/lib/validators/common';
import { PAYMENT_METHODS } from '@/lib/constants';
import { shippingAddressSchema } from '@/lib/validators/shipping-address.validator';

export const insertOrderSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  itemsPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: 'Invalid payment method',
  }),
  shippingAddress: shippingAddressSchema,
});
