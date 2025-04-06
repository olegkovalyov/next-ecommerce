import { notFound } from 'next/navigation';
import { ProductService } from '@/application/services/product/product.service';
import { CartService } from '@/application/services/cart/cart.service';
import CartEntity from '@/domain/entities/cart.entity';
import { Cart } from '@/lib/contracts/cart';
import { auth } from '@/infrastructure/auth/auth';
import ProductDetails from '@/presentation/components/shared/product/product-details';
import ProductImages from '@/presentation/components/shared/product/product-images';
import ProductActions from '@/presentation/components/shared/product/product-actions';
import { ProductDto } from '@/domain/entities/product.entity';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  try {
    const { slug } = await params;
    const productResult = await ProductService.getProductBySlug(slug);
    if (!productResult.success) {
      return notFound();
    }

    const product = productResult.value;
    if (!product) {
      return notFound();
    }
    // Convert product to plain object and serialize for client components
    const productDto: ProductDto = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      images: product.images,
      brand: product.brand,
      description: product.description,
      stock: product.stock,
      price: product.price,
      rating: product.rating,
      numReviews: product.numReviews,
      isFeatured: product.isFeatured,
      banner: product.banner,
      createdAt: product.createdAt
    };

    return (
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="col-span-2">
            <ProductImages images={product.images} />
          </div>
          <div className="col-span-2 p-5">
            <ProductDetails product={product} />
          </div>
          <ProductActions
            productDto={productDto}
          />
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    return notFound();
  }
}
