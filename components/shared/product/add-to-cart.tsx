'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useTransition } from 'react';
import { Cart, CartItem } from '@/lib/contracts/cart';
import { addCartItem } from '@/lib/actions/cart/add-cart-item.action';
import { removeCartItem } from '@/lib/actions/cart/remove-cart-item.action';

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const addCartItemResult = await addCartItem(item);
      console.log(addCartItemResult);

      if (!addCartItemResult.success) {
        toast({
          variant: 'destructive',
          description: addCartItemResult.error.message,
        });
        return;
      }

      // Handle success add to cart
      toast({
        description: addCartItemResult.value,
        action: (
          <ToastAction
            className="bg-primary text-white hover:bg-gray-800"
            altText="Go To Cart"
            onClick={() => router.push('/cart')}
          >
            Go To Cart
          </ToastAction>
        ),
      });
    });
  };

  // Handle remove from cart
  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const resultRemoveCartItem = await removeCartItem(item.productId);

      toast({
        variant: resultRemoveCartItem.success ? 'default' : 'destructive',
        description: resultRemoveCartItem.success ? resultRemoveCartItem.value : resultRemoveCartItem.error.message,
      });

      return;
    });
  };

  // Check if item is in cart
  const existItem =
    cart && cart.items.find((x) => x.productId === item.productId);

  return existItem ? (
    <div>
      <Button type="button" variant="outline" onClick={handleRemoveFromCart}>
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </Button>
      <span className="px-2">{existItem.qty}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      {isPending ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}{' '}
      Add To Cart
    </Button>
  );
};

export default AddToCart;
