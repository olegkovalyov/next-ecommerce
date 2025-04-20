import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { cookies } from 'next/headers';
import { CartRepository } from '@/infrastructure/repositories/cart.repository';
import { prisma } from '@/infrastructure/prisma/prisma';

export async function POST(): Promise<NextResponse> {
  console.log('works');
  const user = (await auth())?.user;
  console.log(user)
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
  const cartRepository = new CartRepository(prisma);
  const cartResult = await cartRepository.findByUserId(user.id);
  if (cartResult.success) {
    cartDto = cartResult.value.toDto();
  }

  return NextResponse.json({ success: true, cartDto: JSON.stringify(cartDto) }, { status: 200 });
}
