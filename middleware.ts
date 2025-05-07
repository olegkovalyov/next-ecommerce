import { NextRequest, NextResponse } from 'next/server';
import { Container } from './lib/di/container';

export function middleware(request: NextRequest): NextResponse{
  Container.getInstance();

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
