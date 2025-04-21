import { Metadata } from 'next';
import { getUserById } from '@/lib/actions/user/user.actions';
import PaymentMethodForm from '@/presentation/components/shared/payment-method/payment-method-form';
import CheckoutSteps from '@/presentation/components/shared/checkout/checkout-steps';
import { auth } from '@/infrastructure/auth/auth';
import { ReactElement } from 'react';

export const metadata: Metadata = {
  title: 'Select Payment Method',
};

const PaymentMethodPage = async (): Promise<ReactElement> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={2} />
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} />
    </>
  );
};

export default PaymentMethodPage;
