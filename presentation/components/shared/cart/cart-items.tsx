'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/presentation/components/ui/button';
import { Loader, Minus, Plus } from 'lucide-react';
import { ReactElement } from 'react';
import { CartDto } from '@/domain/dtos';
import { useCartActions } from '@/application/hooks/use-cart-handlers';

export function CartItems({ cartDto }: { cartDto: CartDto }): ReactElement {
  const { isPending, handleCartItemAction } = useCartActions({
    cartDto,
  });

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
                    onClick={() => handleCartItemAction('remove', item.productDto)}
                    disabled={isPending || item.quantity === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <p className="mx-2 text-gray-500"><strong>{item.quantity}</strong></p>
                  <Button
                    variant="outline"
                    type="button"
                    size="icon"
                    className="font-medium text-black hover:text-indigo-500"
                    onClick={() => handleCartItemAction('add', item.productDto)}
                    disabled={isPending || item.quantity >= item.productDto.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCartItemAction('remove', item.productDto)}
                  disabled={isPending}
                >
                  {isPending ? (
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
