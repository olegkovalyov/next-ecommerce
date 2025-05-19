import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { cookies } from 'next/headers';
import { Container } from '@/lib/di';

export async function POST(): Promise<NextResponse> {
  const user = (await auth())?.user;
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: 'Access denied.',
      },
      { status: 403 },
    );
  }
  const cookieStore = await cookies();
  const cartSyncCookie = cookieStore.get('cart-sync');
  console.log(cartSyncCookie);

  let cartDto = null;
  const cartResult = await Container.getInstance().getCartService().loadByUserId(user.id);
  if (cartResult.success) {
    cartDto = cartResult.value.toDto();
  }

  return NextResponse.json({ success: true, cartDto: JSON.stringify(cartDto) }, { status: 200 });
}
