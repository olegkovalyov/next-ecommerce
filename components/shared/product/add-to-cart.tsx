'use client';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Loader } from 'lucide-react';
import { useTransition } from 'react';
import { Cart } from '@/lib/contracts/cart';
import { addToCart } from '@/lib/actions/cart/add-to-cart.action';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';
import { toast } from 'sonner';

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
  };
  cart?: Cart | null;
}

const AddToCart = ({ product, cart }: AddToCartProps) => {
  const [isPending, startTransition] = useTransition();

  const handleCartAction = async (action: 'add' | 'remove') => {
    startTransition(async () => {
      try {
        const result = action === 'add'
          ? await addToCart(product, 1)
          : await removeFromCart(product.id);

        if (result.success) {
          toast.success(result.value);
        } else {
          toast.error(result.error.message);
        }
      } catch (error) {
        console.error('Error handling cart action:', error);
        toast.error('Failed to update cart');
      }
    });
  };

  console.log('Cart items: ',cart?.items);

  const existingItem = cart?.items.find(item => item.productId === product.id);

  if (!existingItem) {
    return (
      <Button
        onClick={() => handleCartAction('add')}
        disabled={isPending || product.stock <= 0}
        className="w-full"
      >
        {isPending ? 'Adding...' : 'Add to Cart'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleCartAction('remove')}
        disabled={isPending || existingItem.qty < 1}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </Button>
      <span className="px-2">{existingItem.qty}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleCartAction('add')}
        disabled={isPending || existingItem.qty >= product.stock}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

};

export default AddToCart;
