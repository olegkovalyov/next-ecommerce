import { PrismaClient } from '@prisma/client';
import { CartRepository } from '../cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartDto } from '@/domain/dtos/cart.dto';
import { CartItemDto } from '@/domain/dtos/cart-item.dto';
import crypto from 'crypto';

describe('CartRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: CartRepository;
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new CartRepository(prisma);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password',
      },
    });
    testUserId = user.id;

    // Create test product with a unique slug
    const uniqueId = crypto.randomUUID();
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: `test-product-${uniqueId}`,
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
    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up cart items before each test
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();

    // Create test product if it doesn't exist
    const existingProduct = await prisma.product.findUnique({
      where: { id: testProductId },
    });

    if (!existingProduct) {
      const uniqueId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${uniqueId}`,
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
      testProductId = product.id;
    }
  });

  describe('findByUserId', () => {
    it('should return null when cart does not exist', async () => {
      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeNull();
      }
    });

    it('should return cart when it exists', async () => {
      // Create test cart
      const cart = await prisma.cart.create({
        data: {
          userId: testUserId,
        },
      });

      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(CartEntity);
        expect(result.value?.id).toBe(cart.id);
      }
    });
  });

  describe('save', () => {
    it('should create new cart', async () => {
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
    });

    it('should update existing cart with items', async () => {
      // Create initial cart
      const cart = await prisma.cart.create({
        data: {
          userId: testUserId,
        },
      });

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
    });
  });

  describe('delete', () => {
    it('should delete cart and its items', async () => {
      // Create test cart with items
      const cart = await prisma.cart.create({
        data: {
          userId: testUserId,
          items: {
            create: {
              productId: testProductId,
              quantity: 2,
            },
          },
        },
      });

      const result = await repository.delete(cart.id);
      expect(result.success).toBe(true);

      // Verify cart is deleted
      const deletedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
      });
      expect(deletedCart).toBeNull();

      // Verify cart items are deleted
      const cartItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
      });
      expect(cartItems).toHaveLength(0);
    });
  });
});
