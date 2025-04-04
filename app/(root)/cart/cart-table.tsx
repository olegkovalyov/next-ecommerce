'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { ArrowRight, Loader, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cart } from '@/lib/contracts/cart';
import { formatCurrency } from '@/lib/utils';
import { updateCartItem } from '@/lib/actions/cart/update-cart-item.action';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';

const CartTable = ({ cart }: { cart?: Cart }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    startTransition(async () => {
      const result = await updateCartItem(productId, newQty);
      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.error.message,
        });
      }
      router.refresh();
    });
  };

  const handleRemoveItem = async (productId: string) => {
    startTransition(async () => {
      const result = await removeFromCart(productId);
      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.error.message,
        });
      }
      router.refresh();
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        Cart is empty. <Link href='/'>Go Shopping</Link>
      </div>
    );
  }

  const itemsPrice = cart.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxPrice = itemsPrice * (cart.taxPercentage / 100);
  const totalPrice = itemsPrice + cart.shippingPrice + taxPrice;

  return (
    <>
      <h1 className='py-4 h2-bold'>Shopping Cart</h1>
      <div className='grid md:grid-cols-4 md:gap-5'>
        <div className='overflow-x-auto md:col-span-3'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className='text-center'>Quantity</TableHead>
                <TableHead className='text-right'>Price</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell>
                    <Link
                      href={`/product/${item.slug}`}
                      className='flex items-center'
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className='object-cover'
                      />
                      <span className='px-2'>{item.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center justify-center gap-2'>
                      <Button
                        disabled={isPending}
                        variant='outline'
                        size='sm'
                        onClick={() => handleUpdateQuantity(item.productId, item.qty - 1)}
                      >
                        {isPending ? (
                          <Loader className='w-4 h-4 animate-spin' />
                        ) : (
                          <Minus className='w-4 h-4' />
                        )}
                      </Button>
                      <span>{item.qty}</span>
                      <Button
                        disabled={isPending}
                        variant='outline'
                        size='sm'
                        onClick={() => handleUpdateQuantity(item.productId, item.qty + 1)}
                      >
                        {isPending ? (
                          <Loader className='w-4 h-4 animate-spin' />
                        ) : (
                          <Plus className='w-4 h-4' />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(item.price * item.qty)}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader className='w-4 h-4 animate-spin' />
                      ) : (
                        'Remove'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='md:col-span-1'>
          <Card>
            <CardContent className='p-4'>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Subtotal</span>
                  <span>{formatCurrency(itemsPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Shipping</span>
                  <span>{formatCurrency(cart.shippingPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Tax</span>
                  <span>{formatCurrency(taxPrice)}</span>
                </div>
                <div className='flex justify-between font-bold border-t pt-2'>
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <Button
                  className='w-full mt-4'
                  disabled={isPending}
                  onClick={() => startTransition(() => router.push('/shipping-address'))}
                >
                  {isPending ? (
                    <Loader className='w-4 h-4 animate-spin' />
                  ) : (
                    <ArrowRight className='w-4 h-4' />
                  )}{' '}
                  Proceed to Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CartTable;
