import { auth } from '@/infrastructure/auth/auth';
import { CartFactory } from '@/application/services/cart/cart.factory';
import { ReactElement } from 'react';
import { CartItems } from '@/presentation/components/shared/cart/cart-items';
import { CartSummary } from '@/presentation/components/shared/cart/cart-summary';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';
import { ProductRepository } from '@/infrastructure/prisma/persistence/product.repository';
import { Cart } from '@/lib/contracts/cart';

const CartPage = async (): Promise<ReactElement> => {
  try {
    const session = await auth();
    const strategy = await CartFactory.createCartStrategy();
    const cartResult = await strategy.getCart();

    // If there's an error getting the cart, show empty cart state
    if (!cartResult.success) {
      console.error('Error loading cart:', cartResult.error);
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

    const cart = cartResult.value;
    // If cart is empty or doesn't exist, show empty cart state
    console.log('cart: ', cart);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
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

    // Calculate cart totals
    const itemsPrice = cart.items.reduce(
      (sum: number, item: Cart['items'][number]) => {
        if (!item || !item.product || typeof item.product.price !== 'number' || typeof item.quantity !== 'number') {
          return sum;
        }
        return sum + item.product.price * item.quantity;
      },
      0
    );
    const taxPrice = (itemsPrice * cart.taxPercentage) / 100;
    const totalPrice = itemsPrice + cart.shippingPrice + taxPrice;

    const getInStockCount = async (productId: string) => {
      const productResult = await ProductRepository.getProductById(productId);
      if (productResult.success) {
        return productResult.value.stock;
      }
      return 0;
    };

    const inStockQuantity = [];
    for (const item of cart.items) {
      if (item && item.productId) {
        inStockQuantity.push({
          productId: item.productId,
          inStockQuantity: await getInStockCount(item.productId)
        });
      }
    }

    // Transform cart items to match CartItems component props
    const transformedItems = cart.items
      .filter((item: Cart['items'][number]) => item && item.product)
      .map((item: Cart['items'][number]) => ({
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        qty: item.quantity,
        image: item.product.images[0]
      }));

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CartItems items={transformedItems} inStockQuantity={inStockQuantity} />
          </div>
          <div className="lg:col-span-1">
            <CartSummary
              itemsPrice={itemsPrice}
              shippingPrice={cart.shippingPrice}
              taxPrice={taxPrice}
              totalPrice={totalPrice}
              isGuest={!session?.user?.id}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    // Show empty cart state instead of notFound
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
};

export default CartPage;
