import { PrismaClient } from '@prisma/client';
import { CartRepository } from '../cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartDto } from '@/domain/dtos/cart.dto';
import { CartItemDto } from '@/domain/dtos/cart-item.dto';
import crypto from 'crypto';

describe('CartRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: CartRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new CartRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findByUserId', () => {
    it('should return null when cart does not exist', async () => {
      const testUserId = crypto.randomUUID();
      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(false);
    });

    it('should return cart when it exists', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test cart
      const cartId = crypto.randomUUID();
      const cart = await prisma.cart.create({
        data: {
          id: cartId,
          userId: testUserId,
        },
      });

      try {
        const result = await repository.findByUserId(testUserId);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBeInstanceOf(CartEntity);
          expect(result.value?.id).toBe(cart.id);
        }
      } finally {
        // Cleanup
        await prisma.cart.deleteMany({ where: { id: cartId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe('save', () => {
    it('should create new cart', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      try {
        const cartDto: CartDto = {
          id: '',
          userId: testUserId,
          cartItemDtos: [],
          taxPercentage: 0,
        };

        const cartEntity = CartEntity.fromDto(cartDto);
        if (!cartEntity.success) {
          throw new Error('Failed to create cart entity');
        }

        const result = await repository.save(cartEntity.value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBeInstanceOf(CartEntity);
          expect(result.value.id).toBeTruthy();
          expect(result.value.userId).toBe(testUserId);
        }
      } finally {
        // Cleanup
        await prisma.cart.deleteMany({ where: { userId: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should update existing cart with items', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${crypto.randomUUID()}`,
          category: 'Test Category',
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          images: ['test-image.jpg'],
          price: 100,
          rating: 4.5,
          numReviews: 0,
        },
      });

      // Create initial cart
      const cartId = crypto.randomUUID();
      const cart = await prisma.cart.create({
        data: {
          id: cartId,
          userId: testUserId,
        },
      });

      try {
        const cartItemDto: CartItemDto = {
          id: crypto.randomUUID(),
          cartId: cart.id,
          productId: testProductId,
          quantity: 2,
          productDto: {
            id: testProductId,
            name: 'Test Product',
            slug: 'test-product',
            category: 'Test Category',
            brand: 'Test Brand',
            description: 'Test Description',
            stock: 10,
            images: ['test-image.jpg'],
            price: 100,
            rating: 4.5,
            numReviews: 0,
            isFeatured: false,
            banner: null,
            createdAt: new Date(),
          },
        };

        const cartDto: CartDto = {
          id: cart.id,
          userId: testUserId,
          cartItemDtos: [cartItemDto],
          taxPercentage: 0,
        };

        const cartEntity = CartEntity.fromDto(cartDto);
        if (!cartEntity.success) {
          throw new Error('Failed to create cart entity');
        }

        const result = await repository.save(cartEntity.value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBeInstanceOf(CartEntity);
          expect(result.value.id).toBe(cart.id);
          const cartItems = result.value.getCartItemsArray();
          expect(cartItems).toHaveLength(1);
          expect(cartItems[0].productId).toBe(testProductId);
          expect(cartItems[0].quantity).toBe(2);
        }
      } finally {
        // Cleanup
        await prisma.cartItem.deleteMany({ where: { cartId: cartId } });
        await prisma.cart.deleteMany({ where: { id: cartId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe('delete', () => {
    it('should delete cart and its items', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${crypto.randomUUID()}`,
          category: 'Test Category',
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          images: ['test-image.jpg'],
          price: 100,
          rating: 4.5,
          numReviews: 0,
        },
      });

      // Create test cart with items
      const cartId = crypto.randomUUID();
      const cart = await prisma.cart.create({
        data: {
          id: cartId,
          userId: testUserId,
          items: {
            create: {
              productId: testProductId,
              quantity: 2,
            },
          },
        },
      });

      try {
        const result = await repository.delete(cartId);
        expect(result.success).toBe(true);

        // Verify cart and items are deleted
        const deletedCart = await prisma.cart.findUnique({
          where: { id: cartId },
        });
        expect(deletedCart).toBeNull();

        const deletedItems = await prisma.cartItem.findMany({
          where: { cartId: cartId },
        });
        expect(deletedItems).toHaveLength(0);
      } finally {
        // Cleanup
        await prisma.cartItem.deleteMany({ where: { cartId: cartId } });
        await prisma.cart.deleteMany({ where: { id: cartId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should return error when trying to delete non-existent cart', async () => {
      const nonExistentCartId = crypto.randomUUID();
      const result = await repository.delete(nonExistentCartId);
      expect(result.success).toBe(false);
    });
  });
});
