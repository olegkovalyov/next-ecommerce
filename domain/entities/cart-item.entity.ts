import { ProductEntity } from './product.entity';
import { CartItemDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';

export class CartItemEntity {
  private readonly _id: string = '';
  private readonly _cartId: string;
  private readonly _productId: string;
  private _quantity: number;
  private readonly _product: ProductEntity;

  private constructor(data: CartItemDto) {
    this._id = data.id ?? '';
    this._cartId = data.cartId;
    this._productId = data.productId;
    this._quantity = data.quantity;

    const productResult = ProductEntity.fromDto(data.productDto);
    if (!productResult.success) {
      throw productResult.error;
    }
    this._product = productResult.value;
  }

  public static fromDto(data: CartItemDto): Result<CartItemEntity> {
    if (!data.id) {
      return failure(new Error('Cart item must have an ID'));
    }

    if (!data.cartId) {
      return failure(new Error('Cart item must belong to a cart'));
    }

    if (!data.productId) {
      return failure(new Error('Cart item must reference a product'));
    }

    if (data.quantity <= 0) {
      return failure(new Error('Quantity must be a positive number'));
    }

    if (!data.productDto) {
      return failure(new Error('Cart item must have product data'));
    }

    try {
      return success(new CartItemEntity(data));
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create cart item from DTO'));
    }
  }

  public static create(data: CartItemDto): Result<CartItemEntity> {
    return CartItemEntity.fromDto(data);
  }

  public toDto(): CartItemDto {
    return {
      id: this._id,
      cartId: this._cartId,
      productId: this._productId,
      quantity: this._quantity,
      productDto: this._product.toDto(),
    };
  }

  public updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (quantity > this._product.stock) {
      throw new Error(`Not enough stock available. Only ${this._product.stock} items left.`);
    }

    this._quantity = quantity;
  }

  public calculateSubtotal(): number {
    return this._product.price * this._quantity;
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get cartId(): string {
    return this._cartId;
  }

  public get productId(): string {
    return this._productId;
  }

  public get quantity(): number {
    return this._quantity;
  }

  public get product(): ProductEntity {
    return this._product;
  }
}
