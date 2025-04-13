import { CartEntity } from '../cart.entity';
import { CartDto, CartItemDto, ProductDto } from '@/domain/dtos';
import { ProductEntity } from '../product.entity';
import { CartItemEntity } from '../cart-item.entity';

describe('CartEntity', () => {
  const mockProductDto: ProductDto = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    category: 'test',
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    images: ['test.jpg'],
    isFeatured: false,
    banner: null,
    price: 10.00,
    rating: 4.5,
    numReviews: 10,
    createdAt: new Date(),
  };

  const mockCartItemDto: CartItemDto = {
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    quantity: 1,
    productDto: mockProductDto,
  };

  const mockCartDto: CartDto = {
    id: 'cart-1',
    userId: 'user-1',
    shippingPrice: 0,
    taxPercentage: 0,
    cartItemDtos: [mockCartItemDto],
  };

  describe('fromDto', () => {
    it('should create cart from DTO', () => {
      const result = CartEntity.fromDto(mockCartDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cart = result.value;
        expect(cart.id).toBe(mockCartDto.id);
        expect(cart.userId).toBe(mockCartDto.userId);
        expect(cart.shippingPrice).toBe(mockCartDto.shippingPrice);
        expect(cart.taxPercentage).toBe(mockCartDto.taxPercentage);
      }
    });
  });

  describe('toDto', () => {
    it('should convert cart to DTO', () => {
      const result = CartEntity.fromDto(mockCartDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cart = result.value;
        const dto = cart.toDto();
        expect(dto.id).toBe(mockCartDto.id);
        expect(dto.userId).toBe(mockCartDto.userId);
        expect(dto.shippingPrice).toBe(mockCartDto.shippingPrice);
        expect(dto.taxPercentage).toBe(mockCartDto.taxPercentage);
      }
    });
  });

  describe('addItemToCart', () => {
    it('should add new cart item', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const cartItemResult = CartItemEntity.fromDto(mockCartItemDto);

      expect(cartResult.success).toBe(true);
      expect(cartItemResult.success).toBe(true);

      if (cartResult.success && cartItemResult.success) {
        const cart = cartResult.value;
        const cartItem = cartItemResult.value;

        const result = cart.addItemToCart(cartItem);
        expect(result.success).toBe(true);
        if (result.success) {
          const updatedCart = result.value;
          expect(updatedCart.toDto().cartItemDtos.length).toBe(1);
          expect(updatedCart.toDto().cartItemDtos[0].id).toBe(cartItem.id);
        }
      }
    });

    it('should update existing cart item', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const cartItemResult = CartItemEntity.fromDto(mockCartItemDto);

      expect(cartResult.success).toBe(true);
      expect(cartItemResult.success).toBe(true);

      if (cartResult.success && cartItemResult.success) {
        const cart = cartResult.value;
        const cartItem = cartItemResult.value;

        // Add item first
        const addResult = cart.addItemToCart(cartItem);
        expect(addResult.success).toBe(true);

        if (addResult.success) {
          // Update quantity
          const updatedCartItem = CartItemEntity.fromDto({
            ...mockCartItemDto,
            quantity: 2,
          });
          expect(updatedCartItem.success).toBe(true);

          if (updatedCartItem.success) {
            const updateResult = addResult.value.addItemToCart(updatedCartItem.value);
            expect(updateResult.success).toBe(true);

            if (updateResult.success) {
              const finalCart = updateResult.value;
              expect(finalCart.toDto().cartItemDtos.length).toBe(1);
              expect(finalCart.toDto().cartItemDtos[0].quantity).toBe(2);
            }
          }
        }
      }
    });

    it('should fail when cart item has no ID', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const cartItemResult = CartItemEntity.fromDto({
        ...mockCartItemDto,
        id: '',
      });

      expect(cartResult.success).toBe(true);
      expect(cartItemResult.success).toBe(false);
    });

    it('should fail when cart item belongs to different cart', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const cartItemResult = CartItemEntity.fromDto({
        ...mockCartItemDto,
        cartId: 'different-cart-id',
      });

      expect(cartResult.success).toBe(true);
      expect(cartItemResult.success).toBe(true);

      if (cartResult.success && cartItemResult.success) {
        const cart = cartResult.value;
        const cartItem = cartItemResult.value;

        const result = cart.addItemToCart(cartItem);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Cart item belongs to a different cart');
        }
      }
    });
  });

  describe('deleteItemFromCart', () => {
    it('should remove cart item', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const cartItemResult = CartItemEntity.fromDto(mockCartItemDto);

      expect(cartResult.success).toBe(true);
      expect(cartItemResult.success).toBe(true);

      if (cartResult.success && cartItemResult.success) {
        const cart = cartResult.value;
        const cartItem = cartItemResult.value;

        // Add item first
        const addResult = cart.addItemToCart(cartItem);
        expect(addResult.success).toBe(true);

        if (addResult.success) {
          // Remove item
          const removeResult = addResult.value.deleteItemFromCart(cartItem.id);
          expect(removeResult.success).toBe(true);

          if (removeResult.success) {
            const finalCart = removeResult.value;
            expect(finalCart.toDto().cartItemDtos.length).toBe(0);
          }
        }
      }
    });

    it('should fail when item not found', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.deleteItemFromCart('non-existent-id');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('CartItem not found');
        }
      }
    });
  });

  describe('addProduct', () => {
    it('should add product to cart', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto(mockProductDto);

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(true);

      if (cartResult.success && productResult.success) {
        const cart = cartResult.value;
        const product = productResult.value;

        const result = cart.addProduct(product, 1);
        expect(result.success).toBe(true);

        if (result.success) {
          const updatedCart = result.value;
          expect(updatedCart.toDto().cartItemDtos.length).toBe(1);
          expect(updatedCart.toDto().cartItemDtos[0].productId).toBe(product.id);
        }
      }
    });

    it('should fail when product has no ID', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto({
        ...mockProductDto,
        id: '',
      });

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(false);
    });

    it('should fail when quantity is negative', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto(mockProductDto);

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(true);

      if (cartResult.success && productResult.success) {
        const cart = cartResult.value;
        const product = productResult.value;

        const result = cart.addProduct(product, -1);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Quantity must be a positive number');
        }
      }
    });

    it('should fail when not enough stock', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto({
        ...mockProductDto,
        stock: 5,
      });

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(true);

      if (cartResult.success && productResult.success) {
        const cart = cartResult.value;
        const product = productResult.value;

        const result = cart.addProduct(product, 10);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Not enough stock available. Only 5 items left.');
        }
      }
    });
  });

  describe('removeProduct', () => {
    it('should remove product from cart', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto(mockProductDto);

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(true);

      if (cartResult.success && productResult.success) {
        const cart = cartResult.value;
        const product = productResult.value;

        // First add the product
        const addResult = cart.addProduct(product, 2);
        expect(addResult.success).toBe(true);

        if (addResult.success) {
          // Then remove it
          const removeResult = addResult.value.removeProduct(product.id, 1);
          expect(removeResult.success).toBe(true);

          if (removeResult.success) {
            const updatedCart = removeResult.value;
            expect(updatedCart.toDto().cartItemDtos.length).toBe(1);
          }
        }
      }
    });

    it('should fail when product is not in cart', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.removeProduct('non-existent-product-id');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Product not found in cart');
        }
      }
    });

    it('should fail when quantity is negative', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      const productResult = ProductEntity.fromDto(mockProductDto);

      expect(cartResult.success).toBe(true);
      expect(productResult.success).toBe(true);

      if (cartResult.success && productResult.success) {
        const cart = cartResult.value;
        const product = productResult.value;

        // First add the product
        const addResult = cart.addProduct(product, 2);
        expect(addResult.success).toBe(true);

        if (addResult.success) {
          // Then try to remove negative quantity
          const removeResult = addResult.value.removeProduct(product.id, -1);
          expect(removeResult.success).toBe(false);
          if (!removeResult.success) {
            expect(removeResult.error.message).toBe('Quantity must be a positive number');
          }
        }
      }
    });
  });

  describe('setShippingPrice', () => {
    it('should set shipping price', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.setShippingPrice(10);
        expect(result.success).toBe(true);

        if (result.success) {
          const updatedCart = result.value;
          expect(updatedCart.shippingPrice).toBe(10);
        }
      }
    });

    it('should fail when shipping price is negative', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.setShippingPrice(-10);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Shipping price cannot be negative');
        }
      }
    });
  });

  describe('setTaxPercentage', () => {
    it('should set tax percentage', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.setTaxPercentage(10);
        expect(result.success).toBe(true);

        if (result.success) {
          const updatedCart = result.value;
          expect(updatedCart.taxPercentage).toBe(10);
        }
      }
    });

    it('should fail when tax percentage is negative', () => {
      const cartResult = CartEntity.fromDto(mockCartDto);
      expect(cartResult.success).toBe(true);

      if (cartResult.success) {
        const cart = cartResult.value;
        const result = cart.setTaxPercentage(-10);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('Tax percentage cannot be negative');
        }
      }
    });
  });
});
