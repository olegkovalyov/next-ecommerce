import { CartRepository } from '../cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartMapper, CartWithItems } from '../mappers/cart.mapper';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@/infrastructure/prisma/prisma', () => ({
  prisma: {
    cart: {
      findUniqueOrThrow: jest.fn(),
      findFirstOrThrow: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('CartRepository', () => {
  let repository: CartRepository;
  const mockPrisma = {
    cart: {
      findUniqueOrThrow: jest.fn(),
      findFirstOrThrow: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

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

  const mockCart: CartWithItems = {
    id: 'cart-id',
    userId: null,
    shippingPrice: new Decimal('5.00'),
    taxPercentage: new Decimal('10.00'),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [mockCartItem],
  };

  beforeEach(() => {
    repository = new CartRepository(mockPrisma as never);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return cart when found', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(mockCart);

      const result = await repository.findById('cart-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('cart-id');
        expect(result.value.userId).toBeNull();
        expect(result.value.shippingPrice).toBe(5);
        expect(result.value.taxPercentage).toBe(10);
        expect(result.value.cartItems.size).toBe(1);
      }
      expect(mockPrisma.cart.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'cart-id' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return failure when cart not found', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockRejectedValue(new Error('Cart not found'));

      const result = await repository.findById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart not found');
      }
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.cart.findUniqueOrThrow.mockRejectedValue(new Error('Database error'));

      const result = await repository.findById('cart-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart not found');
      }
    });
  });

  describe('findByUserId', () => {
    it('should return cart when found', async () => {
      mockPrisma.cart.findFirstOrThrow.mockResolvedValue(mockCart);

      const result = await repository.findByUserId('user-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('cart-id');
        expect(result.value.userId).toBeNull();
        expect(result.value.shippingPrice).toBe(5);
        expect(result.value.taxPercentage).toBe(10);
        expect(result.value.cartItems.size).toBe(1);
      }
      expect(mockPrisma.cart.findFirstOrThrow).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return failure when cart not found', async () => {
      mockPrisma.cart.findFirstOrThrow.mockRejectedValue(new Error('Cart not found'));

      const result = await repository.findByUserId('non-existent-user-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart not found');
      }
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.cart.findFirstOrThrow.mockRejectedValue(new Error('Database error'));

      const result = await repository.findByUserId('user-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart not found');
      }
    });
  });

  describe('save', () => {
    it('should save new cart successfully', async () => {
      const cartResult = CartEntity.fromDto(CartMapper.toDto(mockCart));
      if (!cartResult.success) {
        throw new Error('Failed to create cart entity');
      }
      const cartEntity = cartResult.value;
      const cartDto = cartEntity.toDto();
      const { cart: prismaCart, items: prismaItems } = CartMapper.toPrismaWithItems(cartDto);

      mockPrisma.cart.upsert.mockResolvedValue(mockCart);

      const result = await repository.save(cartEntity);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('cart-id');
        expect(result.value.userId).toBeNull();
        expect(result.value.shippingPrice).toBe(5);
        expect(result.value.taxPercentage).toBe(10);
        expect(result.value.cartItems.size).toBe(1);
      }
      expect(mockPrisma.cart.upsert).toHaveBeenCalledWith({
        where: { id: cartDto.id },
        create: {
          id: cartDto.id,
          ...prismaCart,
          items: {
            create: prismaItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        update: {
          ...prismaCart,
          items: {
            deleteMany: {},
            create: prismaItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return failure when save fails', async () => {
      const cartResult = CartEntity.fromDto(CartMapper.toDto(mockCart));
      if (!cartResult.success) {
        throw new Error('Failed to create cart entity');
      }
      const cartEntity = cartResult.value;

      mockPrisma.cart.upsert.mockRejectedValue(new Error('Failed to save cart'));

      const result = await repository.save(cartEntity);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save cart');
      }
    });

    it('should handle errors gracefully', async () => {
      const cartResult = CartEntity.fromDto(CartMapper.toDto(mockCart));
      if (!cartResult.success) {
        throw new Error('Failed to create cart entity');
      }
      const cartEntity = cartResult.value;

      mockPrisma.cart.upsert.mockRejectedValue(new Error('Database error'));

      const result = await repository.save(cartEntity);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save cart');
      }
    });
  });

  describe('delete', () => {
    it('should delete cart successfully', async () => {
      mockPrisma.cart.delete.mockResolvedValue(mockCart);
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(mockCart);

      const result = await repository.delete('test-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartEntity);
      }
      expect(mockPrisma.cart.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });

    });

    it('should return failure when delete fails', async () => {
      mockPrisma.cart.delete.mockRejectedValue(new Error('Cart not found'));

      const result = await repository.delete('cart-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete cart');
      }
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.cart.delete.mockRejectedValue(new Error('Database error'));

      const result = await repository.delete('cart-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete cart');
      }
    });
  });
});
