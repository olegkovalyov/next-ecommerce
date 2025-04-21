import { NextResponse } from 'next/server';
import { CartDto } from '@/domain/dtos';
import { CartEntity } from '@/domain/entities/cart.entity';
import { auth } from '@/infrastructure/auth/auth';
import { CartService } from '@/application/services/cart/cart.service';

export async function POST(request: Request): Promise<NextResponse> {

  const session = await auth();
  const isAuthenticated = session?.user !== undefined;
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        message: 'Access denied.',
      },
      { status: 403 },
    );
  }

  const cartDto: CartDto = await request.json();
  const userId = session.user.id;
  const cartCreateResult = CartEntity.fromDto({ ...cartDto, userId });
  if (!cartCreateResult.success) {
    return NextResponse.json({ sucess: false });
  }
  const cart = cartCreateResult.value;
  const result = await CartService.save(cart);
  if (!result.success) {
    return NextResponse.json({ sucess: false }, { status: 500 });
  }

  return NextResponse.json({ sucess: true }, { status: 200 });
}
