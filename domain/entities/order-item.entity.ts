import { ProductEntity } from './product.entity';
import { OrderItemDto, ProductDto } from '../dtos';
import { failure, Result, success } from '../../lib/result/index';

export class OrderItemEntity {
  private readonly _id: string;
  private readonly _orderId: string | null;
  private readonly _productId: string | null;
  private readonly _quantity: number;
  private readonly _price: number;
  private readonly _name: string;
  private readonly _slug: string;
  private readonly _image: string;
  private readonly _product: ProductEntity;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;
  private readonly _productSnapshot?: ProductDto | null;

  private constructor(data: OrderItemDto) {
    this._id = data.id;
    this._orderId = data.orderId;
    this._productId = data.productId;
    this._quantity = data.quantity;
    this._price = data.price;
    this._name = data.name;
    this._slug = data.slug;
    this._image = data.image;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
    this._productSnapshot = data.productSnapshot;

    if (!data.productDto) {
      throw new Error(`OrderItemDto must have a productDto`);
    }

    const productResult = ProductEntity.fromDto(data.productDto);
    if (!productResult.success) {
      throw new Error(`Failed to create product entity`);
    }
    this._product = productResult.value;
  }

  public static fromDto(data: OrderItemDto): Result<OrderItemEntity> {
    if (!data.id) {
      return failure(new Error('Order item DTO must have an id'));
    }

    if (!data.orderId) {
      return failure(new Error('Order item must belong to an order'));
    }

    if (!data.productId) {
      return failure(new Error('Order item must reference a product'));
    }

    if (data.quantity <= 0) {
      return failure(new Error('Quantity must be a positive number'));
    }

    if (data.price <= 0) {
      return failure(new Error('Price must be a positive number'));
    }

    if (!data.name) {
      return failure(new Error('Order item must have a name'));
    }

    if (!data.slug) {
      return failure(new Error('Order item must have a slug'));
    }

    if (!data.image) {
      return failure(new Error('Order item must have an image'));
    }

    if (!data.productDto) {
      return failure(new Error('Order item must have product data'));
    }

    try {
      return success(new OrderItemEntity(data));
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create order item from DTO'));
    }
  }

  public static create(data: OrderItemDto): Result<OrderItemEntity> {
    return OrderItemEntity.fromDto(data);
  }

  public toDto(): OrderItemDto {
    return {
      id: this._id,
      orderId: this._orderId,
      productId: this._productId,
      quantity: this._quantity,
      price: this._price,
      name: this._name,
      slug: this._slug,
      image: this._image,
      productDto: this._product.toDto(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      productSnapshot: this._productSnapshot,
    };
  }

  public calculateSubtotal(): number {
    return this._price * this._quantity;
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get orderId(): string | null {
    return this._orderId;
  }

  public get productId(): string | null {
    return this._productId;
  }

  public get quantity(): number {
    return this._quantity;
  }

  public get price(): number {
    return this._price;
  }

  public get name(): string {
    return this._name;
  }

  public get slug(): string {
    return this._slug;
  }

  public get image(): string {
    return this._image;
  }

  public get product(): ProductEntity {
    return this._product;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  public get productSnapshot(): ProductDto | null | undefined {
    return this._productSnapshot;
  }
}