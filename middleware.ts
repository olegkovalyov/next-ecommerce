import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { CartSyncService } from '@/infrastructure/services/cart-sync.service';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  console.log('PATH: ', request.nextUrl.pathname);


  const session = await auth();
  const userId = session?.user?.id;
  const response = NextResponse.next();

  // Handle login
  // if (request.nextUrl.pathname === '/sign-in' && token?.sub) {
  //   try {
  //     await CartSyncService.syncGuestCartToUser(token.sub);
  //   } catch (error) {
  //     console.error('Failed to sync cart:', error);
  //     // Continue with the request even if sync fails
  //   }
  // }
  //
  // // Handle logout
  // if (request.nextUrl.pathname === '/sign-out') {
  //   // Clear guest cart on logout
  //   response.cookies.delete('guest_cart');
  // }

  return response;
}

export const config = {
  matcher: ['/'],
};
