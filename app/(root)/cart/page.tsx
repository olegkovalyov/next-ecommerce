import CartTable from '@/app/(root)/cart/cart-table';
import { loadCart } from '@/lib/actions/cart/load-cart.action';

export const metadata = {
  title: 'Shopping Cart',
};

const CartPage = async () => {
  const loadCartResult = await loadCart();
  const cart = loadCartResult.ok
    ? loadCartResult.val
    : undefined;

  return (
    <>
      <CartTable cart={cart} />
    </>
  );
};

export default CartPage;
