import { CartItem } from '@/lib/contracts/cart';
import { roundNumber } from '@/lib/utils';

export const calcPrice = (items: CartItem[]) => {
  const itemsPrice = roundNumber(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
    ),
    shippingPrice = roundNumber(itemsPrice > 100 ? 0 : 10),
    taxPrice = roundNumber(0.15 * itemsPrice),
    totalPrice = roundNumber(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};
