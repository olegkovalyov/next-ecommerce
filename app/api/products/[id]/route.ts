import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/di/container';



export async function GET(
  request: NextRequest,
): Promise<NextResponse> {

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const productService = Container.getInstance().getProductService();
    const productResult = await productService.loadProductById(id);

    if (!productResult.success) {
      return NextResponse.json(
        { message: productResult.error?.message || 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(productResult.value.toDto());
  } catch (error) {
    console.error('[product/id]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
