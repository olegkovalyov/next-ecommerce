// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {

  const backUrl = request.headers.get('referer') || '/';
  console.log('Back url: ', backUrl);
  return NextResponse.next();

  // // Only set back URL for sign-in page
  // if (request.nextUrl.pathname === '/signin') {
  //   const response = NextResponse.next();
  //
  //   // Get the referer (previous page) or default to home
  //   const backUrl = request.headers.get('referer') || '/';
  //
  //   // Set secure, HTTP-only cookie
  //   response.cookies.set('backUrl', backUrl, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //     path: '/',
  //     maxAge: 60 * 60, // 1 hour
  //   });
  //
  //   return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/sign-in'],
};
