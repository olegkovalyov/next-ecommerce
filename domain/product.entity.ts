export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  banner: string | null;
  price: number;
  rating: number;
  numReviews: number;
  createdAt: Date;
}

export class ProductEntity {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly category: string;
  public readonly brand: string;
  public readonly description: string;
  public readonly stock: number;
  public readonly images: string[];
  public readonly isFeatured: boolean;
  public readonly banner: string | null;
  public readonly price: number;
  public readonly rating: number;
  public readonly numReviews: number;
  public readonly createdAt: Date;

  public constructor(product: ProductDto) {
    this.id = product.id;
    this.name = product.name;
    this.slug = product.slug;
    this.category = product.category;
    this.brand = product.brand;
    this.description = product.description;
    this.stock = product.stock;
    this.images = product.images;
    this.isFeatured = product.isFeatured;
    this.banner = product.banner;
    this.price = product.price;
    this.rating = product.rating;
    this.numReviews = product.numReviews;
    this.createdAt = product.createdAt;
  }

  static create(productDto: ProductDto) {
    return new ProductEntity(productDto);
  }
}
