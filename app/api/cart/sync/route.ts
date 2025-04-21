import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { cookies } from 'next/headers';
import { CartService } from '@/application/services/cart/cart.service';

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
  const cartResult = await CartService.loadByUserId(user.id);
  if (cartResult.success) {
    cartDto = cartResult.value.toDto();
  }

  return NextResponse.json({ success: true, cartDto: JSON.stringify(cartDto) }, { status: 200 });
}
