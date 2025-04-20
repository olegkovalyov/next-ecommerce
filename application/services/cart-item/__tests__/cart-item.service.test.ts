import { CartItemService } from '../cart-item.service';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartItemDto } from '@/domain/dtos/cart-item.dto';
import { CartItemRepository } from '@/infrastructure/repositories/cart-item.repository';
import { prisma } from '@/infrastructure/prisma/prisma';
import { ProductDto } from '@/domain/dtos/product.dto';

jest.mock('@/infrastructure/repositories/cart-item.repository');
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

describe('CartItemService', () => {
  let cartItemService: CartItemService;
  let mockCartItemRepository: jest.Mocked<CartItemRepository>;

  const mockProductDto: ProductDto = {
    id: 'product-id',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    images: ['test-image.jpg'],
    isFeatured: false,
    banner: null,
    price: 100,
    rating: 4.5,
    numReviews: 100,
    createdAt: new Date(),
  };

  const mockCartItemDto: CartItemDto = {
    id: 'cart-item-id',
    cartId: 'cart-id',
    productId: 'product-id',
    quantity: 2,
    productDto: mockProductDto,
  };

  const mockCartItemEntity = CartItemEntity.fromDto(mockCartItemDto);

  beforeEach(() => {
    jest.clearAllMocks();
    cartItemService = new CartItemService();
    mockCartItemRepository = new CartItemRepository(prisma) as jest.Mocked<CartItemRepository>;
    (CartItemRepository as jest.Mock).mockImplementation(() => mockCartItemRepository);
  });

  describe('createCartItem', () => {
    it('should create a cart item successfully', async () => {
      const result = await cartItemService.createCartItem(mockCartItemDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('cart-item-id');
        expect(result.value.cartId).toBe('cart-id');
        expect(result.value.productId).toBe('product-id');
        expect(result.value.quantity).toBe(2);
        expect(result.value.product.id).toBe('product-id');
        expect(result.value.product.name).toBe('Test Product');
      }
    });

    it('should return failure when cart item data is invalid', async () => {
      const invalidCartItemDto: CartItemDto = {
        ...mockCartItemDto,
        quantity: 0, // Invalid: quantity must be positive
      };

      const result = await cartItemService.createCartItem(invalidCartItemDto);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Quantity must be a positive number');
      }
    });

    it('should return failure when product data is missing', async () => {
      // We're intentionally violating the type here to test the error case
      const invalidCartItemDto = {
        ...mockCartItemDto,
        productDto: undefined,
      } as unknown as CartItemDto;

      const result = await cartItemService.createCartItem(invalidCartItemDto);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item must have product data');
      }
    });
  });

  describe('loadCartItemById', () => {
    it('should load a cart item successfully', async () => {
      if (!mockCartItemEntity.success) {
        throw new Error('Failed to create mock cart item entity');
      }

      mockCartItemRepository.findById.mockResolvedValue(mockCartItemEntity);

      const result = await cartItemService.loadCartItemById('cart-item-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('cart-item-id');
        expect(result.value.cartId).toBe('cart-id');
        expect(result.value.productId).toBe('product-id');
        expect(result.value.quantity).toBe(2);
      }
      expect(mockCartItemRepository.findById).toHaveBeenCalledWith('cart-item-id');
    });

    it('should return failure when cart item not found', async () => {
      mockCartItemRepository.findById.mockResolvedValue({
        success: false,
        error: new Error('Failed to load cart item'),
      });

      const result = await cartItemService.loadCartItemById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item doesnt exist');
      }
    });
  });
});
