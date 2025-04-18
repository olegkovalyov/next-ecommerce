import { CartLoader } from '@/infrastructure/services/cart.loader';
import { auth } from '@/auth';
import { CartItems } from '@/components/shared/cart/cart-items';
import { CartSummary } from '@/components/shared/cart/cart-summary';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const CartPage = async () => {
  const session = await auth();
  const cartResult = await CartLoader.loadOrCreateCart();
  const cart = cartResult.success ? cartResult.value : null;

  if (!cart || cart.getCartData().items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Looks like you haven&#39;t added any items to your cart yet.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const cartData = cart.getCartData();

  // Calculate cart totals
  const itemsPrice = cartData.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const taxPrice = (itemsPrice * cartData.taxPercentage) / 100;
  const totalPrice = itemsPrice + cartData.shippingPrice + taxPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartItems items={cartData.items} />
        </div>
        <div className="lg:col-span-1">
          <CartSummary
            itemsPrice={itemsPrice}
            shippingPrice={cartData.shippingPrice}
            taxPrice={taxPrice}
            totalPrice={totalPrice}
            isGuest={!session?.user?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
