import { CartMapper } from '../cart.mapper';
import { CartDto } from '@/domain/dtos';
import { Decimal } from '@prisma/client/runtime/library';

describe('CartMapper', () => {
  const mockProduct = {
    id: 'product-id',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    images: ['test-image.jpg'],
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    price: new Decimal('10.00'),
    rating: new Decimal('4.5'),
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

  const mockCart = {
    id: 'cart-id',
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [mockCartItem],
  };

  describe('toDto', () => {
    it('should convert Cart with items to CartDto', () => {
      const result = CartMapper.toDto(mockCart);

      expect(result).toEqual({
        id: mockCart.id,
        userId: mockCart.userId,
        taxPercentage: 0,
        cartItemDtos: [{
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
        }],
      });
    });
  });

  describe('toPrisma', () => {
    it('should convert CartDto to Prisma Cart data', () => {
      const cartDto: CartDto = {
        id: 'cart-id',
        userId: null,
        taxPercentage: 0,
        cartItemDtos: [{
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
        }],
      };

      const result = CartMapper.toPrisma(cartDto);

      expect(result).toEqual({
        user: null,
      });
    });
  });

  describe('toPrismaWithItems', () => {
    it('should convert CartDto to Prisma Cart data with items', () => {
      const cartDto: CartDto = {
        id: 'cart-id',
        userId: null,
        taxPercentage: 0,
        cartItemDtos: [{
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
        }],
      };

      const result = CartMapper.toPrismaWithItems(cartDto);

      expect(result).toEqual({
        cart: {
          user: null,
        },
        items: [{
          cartId: cartDto.cartItemDtos[0].cartId,
          productId: cartDto.cartItemDtos[0].productId,
          quantity: cartDto.cartItemDtos[0].quantity,
        }],
      });
    });
  });
});
