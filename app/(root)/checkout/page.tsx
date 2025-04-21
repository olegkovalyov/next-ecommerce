import { Metadata } from 'next';
import ShippingAddress from '@/presentation/components/shared/shipping-address/shipping-address-form';
import CheckoutSteps from '@/presentation/components/shared/checkout/checkout-steps';
import { ReactElement } from 'react';

export const metadata: Metadata = {
  title: 'Shipping Address',
};

const ShippingAddressPage = async (): Promise<ReactElement> => {
  return (
    <>
      <CheckoutSteps current={1} />
      <ShippingAddress address={null} />
    </>
  );
};

export default ShippingAddressPage;
