import { ProductEntity } from '@/domain/entities/product.entity';
import { failure, Result, success } from '@/lib/result';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartDto, CartItemDto } from '@/domain/dtos';

export class CartEntity {
  public readonly id;
  public readonly userId: string | null = null;
  cartItems: Map<string, CartItemEntity> = new Map();
  taxPercentage: number = 0;

  private constructor(cartData: CartDto) {
    this.id = cartData.id ? cartData.id : crypto.randomUUID();
    this.userId = cartData.userId ?? null;
    this.taxPercentage = cartData.taxPercentage;
    this.initCartItemsFromDtos(cartData.cartItemDtos);
  }

  public static fromDto(cartData: CartDto): Result<CartEntity> {
    try {
      const cart = new CartEntity(cartData);
      const initResult = cart.initCartItemsFromDtos(cartData.cartItemDtos);
      if (!initResult.success) {
        return failure(initResult.error);
      }
      return success(cart);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create cart from DTO'));
    }
  }

  public static create(cartData: CartDto): Result<CartEntity> {
    return CartEntity.fromDto(cartData);
  }

  public calculateItemsPrice(): number {
    let total = 0;
    this.cartItems.forEach(item => {
      total += item.calculateSubtotal();
    });
    return this.roundToTwoDecimals(total);
  }

  public calculateTaxPrice(): number {
    const itemsPrice = this.calculateItemsPrice();
    return this.roundToTwoDecimals(itemsPrice * (this.taxPercentage / 100));
  }

  public calculateTotalPrice(): number {
    const itemsPrice = this.calculateItemsPrice();
    const taxPrice = this.calculateTaxPrice();
    return this.roundToTwoDecimals(itemsPrice + taxPrice);
  }

  private calculateTotalItems(): number {
    let total = 0;
    this.cartItems.forEach(item => {
      total += item.quantity;
    });
    return total;
  }

  public toDto(): CartDto {
    return {
      id: this.id,
      userId: this.userId,
      taxPercentage: this.taxPercentage,
      cartItemDtos: Array.from(this.cartItems.values()).map(item => item.toDto()),
    };
  }

  addItemToCart(cartItem: CartItemEntity): Result<CartEntity> {
    if (!cartItem.id) {
      return failure(new Error('CartItem must have an ID'));
    }

    if (cartItem.cartId !== this.id) {
      return failure(new Error('Cart item belongs to a different cart'));
    }

    const existingItem = this.cartItems.get(cartItem.productId);

    if (existingItem) {
      existingItem.updateQuantity(cartItem.quantity);
    } else {
      this.cartItems.set(cartItem.productId, cartItem);
    }
    return success(this);
  }

  deleteItemFromCart(cartItemId: string): Result<CartEntity> {
    const itemToDelete = Array.from(this.cartItems.values()).find(item => item.id === cartItemId);

    if (!itemToDelete) {
      return failure(new Error('CartItem not found'));
    }

    this.cartItems.delete(itemToDelete.productId);
    return success(this);
  }

  addProduct(product: ProductEntity, quantity: number = 1): Result<CartEntity> {
    if (!product.id) {
      return failure(new Error('Product must have an ID'));
    }

    if (quantity <= 0) {
      return failure(new Error('Quantity must be a positive number'));
    }

    if (product.stock < quantity) {
      return failure(new Error(`Not enough stock available. Only ${product.stock} items left.`));
    }

    let currentQuantity = 0;

    this.toDto().cartItemDtos.forEach(item => {
      if (item.productId === product.id) {
        currentQuantity += item.quantity;
      }
    });

    const newQuantity = currentQuantity + quantity;

    if (product.stock < newQuantity) {
      return failure(new Error(`Not enough stock available. Only ${product.stock} items left.`));
    }

    const cartItemResult = CartItemEntity.fromDto({
      id: crypto.randomUUID(),
      cartId: this.id,
      productId: product.id,
      quantity: newQuantity,
      productDto: product.toDto(),
    });

    if (!cartItemResult.success) {
      return failure(cartItemResult.error);
    }

    return this.addItemToCart(cartItemResult.value);
  }

  removeProduct(productId: string, quantity: number = 1): Result<CartEntity> {
    const existingItem = this.cartItems.get(productId);

    if (!existingItem) {
      return failure(new Error('Product not found in cart'));
    }

    if (quantity <= 0) {
      return failure(new Error('Quantity must be a positive number'));
    }

    if (quantity >= existingItem.quantity) {
      return this.deleteItemFromCart(existingItem.id);
    }

    existingItem.updateQuantity(existingItem.quantity - quantity);
    return success(this);
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  setTaxPercentage(percentage: number): Result<CartEntity> {
    if (percentage < 0) {
      return failure(new Error('Tax percentage cannot be negative'));
    }
    this.taxPercentage = this.roundToTwoDecimals(percentage);
    return success(this);
  }

  private initCartItemsFromDtos(cartItems: CartItemDto[]): Result<void> {
    for (const item of cartItems) {
      const cartItem = CartItemEntity.fromDto(item);
      if (!cartItem.success) {
        return failure(new Error(`Failed to initialize cart item: ${cartItem.error.message}`));
      }
      this.cartItems.set(cartItem.value.productId, cartItem.value);
    }
    return success(void 0);
  }
}
