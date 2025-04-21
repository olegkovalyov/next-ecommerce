import { ProductEntity } from './product.entity';
import { OrderItemDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';

export class OrderItemEntity {
  private readonly _orderId: string;
  private readonly _productId: string;
  private readonly _qty: number;
  private readonly _price: number;
  private readonly _name: string;
  private readonly _slug: string;
  private readonly _image: string;
  private readonly _product: ProductEntity;

  private constructor(data: OrderItemDto) {
    this._orderId = data.orderId;
    this._productId = data.productId;
    this._qty = data.qty;
    this._price = data.price;
    this._name = data.name;
    this._slug = data.slug;
    this._image = data.image;

    const productResult = ProductEntity.fromDto(data.productDto);
    if (!productResult.success) {
      throw productResult.error;
    }
    this._product = productResult.value;
  }

  public static fromDto(data: OrderItemDto): Result<OrderItemEntity> {
    if (!data.orderId) {
      return failure(new Error('Order item must belong to an order'));
    }

    if (!data.productId) {
      return failure(new Error('Order item must reference a product'));
    }

    if (data.qty <= 0) {
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
      orderId: this._orderId,
      productId: this._productId,
      qty: this._qty,
      price: this._price,
      name: this._name,
      slug: this._slug,
      image: this._image,
      productDto: this._product.toDto(),
    };
  }

  public calculateSubtotal(): number {
    return this._price * this._qty;
  }

  // Getters
  public get orderId(): string {
    return this._orderId;
  }

  public get productId(): string {
    return this._productId;
  }

  public get qty(): number {
    return this._qty;
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
} 