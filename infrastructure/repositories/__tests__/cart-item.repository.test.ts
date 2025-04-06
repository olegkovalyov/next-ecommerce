import { CartItemRepository } from '../cart-item.repository';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartItemDto } from '@/domain/dtos';
import { prisma } from '@/infrastructure/prisma/prisma';

type ExtendedPrismaClient = typeof prisma;

// Create a complete mock of the Prisma client
const mockPrismaClient = {
  product: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  account: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cart: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
  $use: jest.fn(),
} as unknown as ExtendedPrismaClient;

jest.mock('@/infrastructure/prisma/prisma', () => ({
  prisma: mockPrismaClient,
}));

describe('CartItemRepository', () => {
  let repository: CartItemRepository;
  const mockCartItem = {
    id: 'test-id',
    cartId: 'test-cart-id',
    productId: 'test-product-id',
    quantity: 1,
    product: {
      id: 'test-product-id',
      name: 'Test Product',
      slug: 'test-product',
      category: 'Test Category',
      images: ['test-image.jpg'],
      brand: 'Test Brand',
      description: 'Test Description',
      stock: 10,
      price: 10.00,
      rating: 4.5,
      numReviews: 100,
      isFeatured: false,
      banner: null,
      createdAt: new Date(),
    },
  };

  beforeEach(() => {
    repository = new CartItemRepository(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a cart item when found', async () => {
      (mockPrismaClient.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.findById('test-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartItemEntity);
      }
      expect(mockPrismaClient.cartItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: { product: true },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (mockPrismaClient.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to load cart item');
      }
    });
  });

  describe('findByCartId', () => {
    it('should return a cart item when found', async () => {
      (mockPrismaClient.cartItem.findFirstOrThrow as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.findByCartId('test-cart-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartItemEntity);
      }
      expect(mockPrismaClient.cartItem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { cartId: 'test-cart-id' },
        include: { product: true },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (mockPrismaClient.cartItem.findFirstOrThrow as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.findByCartId('non-existent-cart-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to load cart item');
      }
    });
  });

  describe('save', () => {
    it('should save a cart item successfully', async () => {
      const cartItemDto: CartItemDto = {
        id: 'test-id',
        cartId: 'test-cart-id',
        productId: 'test-product-id',
        quantity: 1,
        productDto: {
          id: 'test-product-id',
          name: 'Test Product',
          slug: 'test-product',
          category: 'Test Category',
          images: ['test-image.jpg'],
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          price: 10.00,
          rating: 4.5,
          numReviews: 100,
          isFeatured: false,
          banner: null,
          createdAt: new Date(),
        },
      };

      const cartItemEntityResult = CartItemEntity.fromDto(cartItemDto);
      if (!cartItemEntityResult.success) {
        throw new Error('Failed to create cart item entity');
      }

      (mockPrismaClient.cartItem.upsert as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.save(cartItemEntityResult.value);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartItemEntity);
      }
      expect(mockPrismaClient.cartItem.upsert).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        create: expect.any(Object),
        update: expect.any(Object),
        include: { product: true },
      });
    });

    it('should return failure when save fails', async () => {
      const cartItemDto: CartItemDto = {
        id: 'test-id',
        cartId: 'test-cart-id',
        productId: 'test-product-id',
        quantity: 1,
        productDto: {
          id: 'test-product-id',
          name: 'Test Product',
          slug: 'test-product',
          category: 'Test Category',
          images: ['test-image.jpg'],
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          price: 10.00,
          rating: 4.5,
          numReviews: 100,
          isFeatured: false,
          banner: null,
          createdAt: new Date(),
        },
      };

      const cartItemEntityResult = CartItemEntity.fromDto(cartItemDto);
      if (!cartItemEntityResult.success) {
        throw new Error('Failed to create cart item entity');
      }

      (mockPrismaClient.cartItem.upsert as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const result = await repository.save(cartItemEntityResult.value);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save cart item');
      }
    });
  });

  describe('delete', () => {
    it('should delete a cart item successfully', async () => {
      (mockPrismaClient.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (mockPrismaClient.cartItem.delete as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.delete('test-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartItemEntity);
      }
      expect(mockPrismaClient.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (mockPrismaClient.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to load cart item');
      }
    });

    it('should return failure when delete fails', async () => {
      (mockPrismaClient.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (mockPrismaClient.cartItem.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await repository.delete('test-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete cart item');
      }
    });
  });
});
