import { CartItemRepository } from '../cart-item.repository';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartItemDto } from '@/domain/dtos';
import { prisma } from '@/infrastructure/prisma/prisma';
import { Result } from '@/lib/result';

jest.mock('@/infrastructure/prisma/prisma', () => ({
  prisma: {
    cartItem: {
      findUnique: jest.fn(),
      findFirstOrThrow: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
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
      price: '10.00',
      rating: '4.5',
      numReviews: 100,
      isFeatured: false,
      banner: null,
      createdAt: new Date(),
    },
  };

  beforeEach(() => {
    repository = new CartItemRepository(prisma);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a cart item when found', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.findById('test-id');

      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(CartItemEntity);
      expect(prisma.cartItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: { product: true },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to load cart item');
    });
  });

  describe('findByCartId', () => {
    it('should return a cart item when found', async () => {
      (prisma.cartItem.findFirstOrThrow as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.findByCartId('test-cart-id');

      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(CartItemEntity);
      expect(prisma.cartItem.findFirstOrThrow).toHaveBeenCalledWith({
        where: { cartId: 'test-cart-id' },
        include: { product: true },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (prisma.cartItem.findFirstOrThrow as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.findByCartId('non-existent-cart-id');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to load cart item');
    });
  });

  describe('save', () => {
    it('should save a cart item successfully', async () => {
      const cartItemEntity = CartItemEntity.fromDto({
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
          price: '10.00',
          rating: '4.5',
          numReviews: 100,
          isFeatured: false,
          banner: null,
          createdAt: new Date(),
        },
      });

      (prisma.cartItem.upsert as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.save(cartItemEntity.value);

      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(CartItemEntity);
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        create: expect.any(Object),
        update: expect.any(Object),
        include: { product: true },
      });
    });

    it('should return failure when save fails', async () => {
      const cartItemEntity = CartItemEntity.fromDto({
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
          price: '10.00',
          rating: '4.5',
          numReviews: 100,
          isFeatured: false,
          banner: null,
          createdAt: new Date(),
        },
      });

      (prisma.cartItem.upsert as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const result = await repository.save(cartItemEntity.value);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to save cart item');
    });
  });

  describe('delete', () => {
    it('should delete a cart item successfully', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (prisma.cartItem.delete as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await repository.delete('test-id');

      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(CartItemEntity);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should return failure when cart item is not found', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.delete('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to load cart item');
    });

    it('should return failure when delete fails', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (prisma.cartItem.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await repository.delete('test-id');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to delete cart item');
    });
  });
}); 