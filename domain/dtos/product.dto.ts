export interface ProductDto {
  readonly id?: string;
  readonly name: string;
  readonly slug: string;
  readonly category: string;
  readonly brand: string;
  readonly description: string;
  readonly stock: number;
  readonly images: string[];
  readonly isFeatured: boolean;
  readonly banner: string | null;
  readonly price: number;
  readonly rating: number;
  readonly numReviews: number;
  readonly createdAt: Date;
}
