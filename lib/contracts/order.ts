import { PAYMENT_METHODS } from '@/lib/constants';
import { ShippingAddress } from '@/lib/contracts/shipping-address';

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export type Order = {
  userId: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
}
