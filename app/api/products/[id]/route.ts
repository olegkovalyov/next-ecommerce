import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/di/container';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productService = Container.getInstance().getProductService();
    const productResult = await productService.loadProductById(params.id);

    if (!productResult.success) {
      return NextResponse.json(
        { message: productResult.error.message },
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