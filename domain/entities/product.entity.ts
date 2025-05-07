import { ProductDto } from '../dtos';
import { failure, Result, success } from '@/lib/result';

export class ProductEntity {
  private readonly _id: string = '';
  private readonly _name: string;
  private readonly _slug: string;
  private readonly _category: string;
  private readonly _brand: string;
  private readonly _description: string;
  private readonly _stock: number;
  private readonly _images: string[];
  private readonly _isFeatured: boolean;
  private readonly _banner: string | null;
  private readonly _price: number;
  private readonly _rating: number;
  private readonly _numReviews: number;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  private constructor(product: ProductDto) {
    this._id = product.id ?? '';
    this._name = product.name;
    this._slug = product.slug;
    this._category = product.category;
    this._brand = product.brand;
    this._description = product.description;
    this._stock = product.stock;
    this._images = product.images;
    this._isFeatured = product.isFeatured;
    this._banner = product.banner;
    this._price = product.price;
    this._rating = product.rating;
    this._numReviews = product.numReviews;
    this._createdAt = product.createdAt ?? new Date();
    this._updatedAt = product.updatedAt ?? new Date();
  }

  public static fromDto(productDto: ProductDto): Result<ProductEntity> {
    if (!productDto.id) {
      return failure(new Error('Product must have an ID'));
    }

    if (!productDto.name) {
      return failure(new Error('Product must have a name'));
    }

    if (!productDto.slug) {
      return failure(new Error('Product must have a slug'));
    }

    if (productDto.stock < 0) {
      return failure(new Error('Stock cannot be negative'));
    }

    if (productDto.price < 0) {
      return failure(new Error('Price cannot be negative'));
    }

    if (productDto.rating < 0 || productDto.rating > 5) {
      return failure(new Error('Rating must be between 0 and 5'));
    }

    if (productDto.numReviews < 0) {
      return failure(new Error('Number of reviews cannot be negative'));
    }

    try {
      return success(new ProductEntity(productDto));
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create product from DTO'));
    }
  }

  public static create(productDto: ProductDto): Result<ProductEntity> {
    return ProductEntity.fromDto(productDto);
  }

  public toDto(): ProductDto {
    return {
      id: this._id,
      name: this._name,
      slug: this._slug,
      category: this._category,
      brand: this._brand,
      description: this._description,
      stock: this._stock,
      images: this._images,
      isFeatured: this._isFeatured,
      banner: this._banner,
      price: this._price,
      rating: this._rating,
      numReviews: this._numReviews,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Business logic methods
  public hasEnoughStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  public calculateTotalPrice(quantity: number): number {
    return this._price * quantity;
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get slug(): string {
    return this._slug;
  }

  public get category(): string {
    return this._category;
  }

  public get brand(): string {
    return this._brand;
  }

  public get description(): string {
    return this._description;
  }

  public get stock(): number {
    return this._stock;
  }

  public get images(): string[] {
    return this._images;
  }

  public get isFeatured(): boolean {
    return this._isFeatured;
  }

  public get banner(): string | null {
    return this._banner;
  }

  public get price(): number {
    return this._price;
  }

  public get rating(): number {
    return this._rating;
  }

  public get numReviews(): number {
    return this._numReviews;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
