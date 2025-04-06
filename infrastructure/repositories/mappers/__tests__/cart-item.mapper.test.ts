import { CartItemMapper } from '../cart-item.mapper';
import { CartItemDto } from '@/domain/dtos';

describe('CartItemMapper', () => {
  const mockProduct = {
    id: 'product-id',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    images: ['test-image.jpg'],
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    price: '10.00',
    rating: '4.5',
    numReviews: 100,
    isFeatured: false,
    banner: null,
    createdAt: new Date(),
  };

  const mockCartItem = {
    id: 'cart-item-id',
    cartId: 'cart-id',
    productId: 'product-id',
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
  };

  describe('toDto', () => {
    it('should convert CartItem to CartItemDto', () => {
      const result = CartItemMapper.toDto(mockCartItem);

      expect(result).toEqual({
        id: mockCartItem.id,
        cartId: mockCartItem.cartId,
        productId: mockCartItem.productId,
        quantity: mockCartItem.quantity,
        productDto: {
          id: mockProduct.id,
          name: mockProduct.name,
          slug: mockProduct.slug,
          category: mockProduct.category,
          images: mockProduct.images,
          brand: mockProduct.brand,
          description: mockProduct.description,
          stock: mockProduct.stock,
          price: Number(mockProduct.price),
          rating: Number(mockProduct.rating),
          numReviews: mockProduct.numReviews,
          isFeatured: mockProduct.isFeatured,
          banner: mockProduct.banner,
          createdAt: mockProduct.createdAt,
        },
      });
    });
  });

  describe('toPrisma', () => {
    it('should convert CartItemDto to Prisma CartItem data', () => {
      const cartItemDto: CartItemDto = {
        id: 'cart-item-id',
        cartId: 'cart-id',
        productId: 'product-id',
        quantity: 2,
        productDto: {
          id: mockProduct.id,
          name: mockProduct.name,
          slug: mockProduct.slug,
          category: mockProduct.category,
          images: mockProduct.images,
          brand: mockProduct.brand,
          description: mockProduct.description,
          stock: mockProduct.stock,
          price: Number(mockProduct.price),
          rating: Number(mockProduct.rating),
          numReviews: mockProduct.numReviews,
          isFeatured: mockProduct.isFeatured,
          banner: mockProduct.banner,
          createdAt: mockProduct.createdAt,
        },
      };

      const result = CartItemMapper.toPrisma(cartItemDto);

      expect(result).toEqual({
        cartId: cartItemDto.cartId,
        productId: cartItemDto.productId,
        quantity: cartItemDto.quantity,
      });
    });
  });
}); 