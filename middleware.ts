import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('triggered');
  // Handle session or cookie logic here
  const sessionCartId = request.cookies.get('sessionCartId');
  if (!sessionCartId) {
    // Generate a sessionCartId if not present
    const response = NextResponse.next();
    response.cookies.set('sessionCartId', crypto.randomUUID());
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'], // Paths to which the middleware will apply
};
