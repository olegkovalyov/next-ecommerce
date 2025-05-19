import { getUserById } from '@/lib/actions/user/user.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/presentation/components/ui/card';
import Link from 'next/link';
import { Button } from '@/presentation/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { auth } from '@/infrastructure/auth/auth';
import { ShippingAddress } from '@/lib/contracts/shipping-address';
import CheckoutSteps from '@/presentation/components/shared/checkout/checkout-steps';
import PlaceOrderForm from '@/presentation/components/shared/place-order/place-order-form';
import { ReactElement } from 'react';
import { Container } from '@/lib/di';

export const metadata: Metadata = {
  title: 'Place Order',
};

const PlaceOrderPage = async (): Promise<ReactElement> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const cartResult = await Container.getInstance().getCartService().loadByUserId(userId);
  if (!cartResult.success) {
    redirect('/cart');
  }
  const cart = cartResult.value;

  const user = await getUserById(userId);

  const validateCheckoutStep = () => {
    if (!cart?.toDto().cartItemDtos.length) {
      return '/cart';
    }

    if (!user.address) {
      return '/shipping-address';
    }

    return null;
  };

  const redirectPath = validateCheckoutStep();
  if (redirectPath) {
    redirect(redirectPath);
  }

  const userAddress = user.address as unknown as ShippingAddress;

  return (
    <>
      <CheckoutSteps current={1} />
      <h1 className="py-4 text-2xl">Place Order</h1>
      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Shipping Address</h2>
              <p>{userAddress.fullName}</p>
              <p>
                {userAddress.streetAddress}, {userAddress.city}{' '}
                {userAddress.postalCode}, {userAddress.country}{' '}
              </p>
              <div className="mt-3">
                <Link href="/shipping-address">
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.toDto().cartItemDtos.map((item) => (
                    <TableRow key={item.productDto.slug}>
                      <TableCell>
                        <Link
                          href={`/product/{item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            src={item.productDto.images[0]}
                            alt={item.productDto.name}
                            width={50}
                            height={50}
                          />
                          <span className="px-2">{item.productDto.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="px-2">{item.quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.productDto.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-4 gap-4 space-y-4">
              <div className="flex justify-between">
                <div>Items</div>
                <div>{formatCurrency(cart.calculateItemsPrice())}</div>
              </div>
              <div className="flex justify-between">
                <div>Tax</div>
                <div>{formatCurrency(cart.calculateTaxPrice())}</div>
              </div>
              <div className="flex justify-between">
                <div>Shipping</div>
                <div>{formatCurrency(0)}</div>
              </div>
              <div className="flex justify-between">
                <div>Total</div>
                <div>{formatCurrency(cart.calculateTotalPrice())}</div>
              </div>
              <PlaceOrderForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PlaceOrderPage;
