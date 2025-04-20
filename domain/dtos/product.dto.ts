export class ProductDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly category: string,
    public readonly brand: string,
    public readonly description: string,
    public readonly stock: number,
    public readonly images: string[],
    public readonly isFeatured: boolean,
    public readonly banner: string | null,
    public readonly price: number,
    public readonly rating: number,
    public readonly numReviews: number,
    public readonly createdAt: Date,
  ) {
  }
}
