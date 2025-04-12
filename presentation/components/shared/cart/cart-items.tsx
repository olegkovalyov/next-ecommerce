'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';
import { useRouter } from 'next/navigation';
import { Button } from '@/presentation/components/ui/button';
import { Loader, Minus, Plus } from 'lucide-react';
import { ReactElement } from 'react';
import { CartDto } from '@/domain/dtos';

export function CartItems({cartDto}: { cartDto: CartDto }): ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    // setLoading((prev) => ({ ...prev, [productId]: true }));
    // try {
    //   const result = await updateCartItem(productId, newQty);
    //   if (!result.success) {
    //     console.error('Failed to update cart:', result.error);
    //   }
    //   router.refresh();
    // } catch (error) {
    //   console.error('Error updating cart:', error);
    // } finally {
    //   setLoading((prev) => ({ ...prev, [productId]: false }));
    // }
  };

  const getInStockQuantity = (productId: string): number => {
    // const existingProduct = inStockQuantity.filter((product) => {
    //   return product.productId === productId;
    // });
    // if (existingProduct.length) {
    //   return existingProduct[0].inStockQuantity;
    // }
    return 0;
  };

  const handleRemoveItem = async (productId: string, shouldRemoveAll: boolean = false) => {
    setLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const result = await removeFromCart(cartDto, productId);
      if (!result.success) {
        console.error('Failed to remove item:', result.error);
      }
      router.refresh();
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-my-6 divide-y divide-gray-200">
        {cartDto.cartItemDtos.map((item) => (
          <li key={item.productId} className="flex py-6">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
              <Image
                src={item.productDto.images[0]}
                alt={item.productDto.name}
                width={96}
                height={96}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="ml-4 flex flex-1 flex-col">
              <div>
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <h3>
                    <Link href={`/product/${item.productDto.slug}`}>{item.productDto.name}</Link>
                  </h3>
                  <p className="ml-4">${item.productDto.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between text-sm">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    type="button"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    disabled={loading[item.productId] || item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <p className="mx-2 text-gray-500"><strong>{item.quantity}</strong></p>
                  <Button
                    variant="outline"
                    type="button"
                    size="icon"
                    className="font-medium text-black hover:text-indigo-500"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={loading[item.productId] || item.quantity >= getInStockQuantity(item.productId)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveItem(item.productId, true)}
                  disabled={loading[item.productId]}
                >
                  {loading[item.productId] ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
