import { CartItem } from '@/lib/contracts/cart';
import { ProductEntity } from '@/domain/product.entity';
import { failure, Result, success } from '@/lib/result';

export type CartDto = {
  id: string;
  sessionCartId?: string;
  userId?: string | null;
  shippingPrice: number;
  taxPercentage: number;
  items: CartItem[];
};

class CartEntity {
  public readonly id: string = '';
  public readonly userId: string | null = null;
  private items: Map<string, CartItem> = new Map();
  private sessionCartId: string = '';
  private shippingPrice: number = 0;
  private taxPercentage: number = 0;

  private constructor(cartData: CartDto) {
    this.id = cartData.id;
    this.sessionCartId = cartData.sessionCartId ?? '';
    this.userId = cartData.userId ?? null;
    this.shippingPrice = cartData.shippingPrice;
    this.taxPercentage = cartData.taxPercentage;
    this.initItems(cartData.items);
  }

  public static create(cartData: CartDto) {
    return new CartEntity(cartData);
  }

  private calculateItemsPrice(): number {
    let total = 0;
    this.items.forEach(item => {
      total += item.price * item.qty;
    });
    return this.roundToTwoDecimals(total);
  }

  private calculateTaxPrice(): number {
    const itemsPrice = this.calculateItemsPrice();
    return this.roundToTwoDecimals(itemsPrice * (this.taxPercentage / 100));
  }

  private calculateTotalPrice(): number {
    const itemsPrice = this.calculateItemsPrice();
    const taxPrice = this.calculateTaxPrice();
    return this.roundToTwoDecimals(itemsPrice + taxPrice + this.shippingPrice);
  }

  private calculateTotalItems(): number {
    let total = 0;
    this.items.forEach(item => {
      total += item.qty;
    });
    return total;
  }

  getCartData(): CartDto {
    const itemsPrice = this.calculateItemsPrice();
    const taxPrice = this.calculateTaxPrice();
    const totalPrice = this.calculateTotalPrice();
    const totalItems = this.calculateTotalItems();

    return {
      id: this.id,
      sessionCartId: this.sessionCartId,
      userId: this.userId,
      shippingPrice: this.shippingPrice,
      taxPercentage: this.taxPercentage,
      items: Array.from(this.items.values()),
    };
  }

  addProduct(product: ProductEntity, quantity: number = 1): Result<typeof CartEntity> {
    if (!product.id) {
      throw new Error('Product must have an ID');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (product.stock < quantity) {
      return failure(new Error(`Not enough stock available. Only ${product.stock} items left.`));
    }

    const existingItem = this.items.get(product.id);

    if (existingItem) {
      existingItem.qty += quantity;
      this.items.set(product.id, existingItem);
    } else {
      const cartItem: CartItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: quantity,
        image: product.images[0] || '',
      };
      this.items.set(product.id, cartItem);
    }

    return success(CartEntity);
  }

  removeProduct(productId: string, quantity: number = 1): CartEntity {
    const existingItem = this.items.get(productId);

    if (!existingItem) {
      throw new Error(`Product with ID ${productId} not found in cart`);
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (existingItem.qty <= quantity) {
      this.items.delete(productId);
    } else {
      existingItem.qty -= quantity;
      this.items.set(productId, existingItem);
    }

    return this;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  setSessionCartId(sessionCartId: string): CartEntity {
    if (!sessionCartId || sessionCartId.trim().length < 1) {
      throw new Error('Session cart id is required');
    }
    this.sessionCartId = sessionCartId;
    return this;
  }

  setShippingPrice(price: number): CartEntity {
    if (isNaN(price) || price < 0) {
      throw new Error('Shipping price must be a valid non-negative number');
    }
    this.shippingPrice = this.roundToTwoDecimals(price);
    return this;
  }

  setTaxPercentage(percentage: number): CartEntity {
    if (percentage < 0) {
      throw new Error('Tax percentage cannot be negative');
    }
    this.taxPercentage = percentage;
    return this;
  }

  private initItems(cartItems: CartItem[]): CartEntity {
    this.items.clear();

    cartItems.forEach(item => {
      if (!item.productId) {
        throw new Error('Cart item must have a productId');
      }

      if (!item.name || !item.slug || item.qty === undefined || item.price === undefined) {
        throw new Error(`Cart item with ID ${item.productId} is missing required fields`);
      }

      this.items.set(item.productId, {
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        qty: item.qty,
        image: item.image || '',
        price: item.price,
      });
    });

    return this;
  }
}

export default CartEntity;
