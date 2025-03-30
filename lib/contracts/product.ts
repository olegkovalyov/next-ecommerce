export interface ProductInterface {
  name: string;
  slug: string;
  category: string;
  description: string;
  images: string[];
  price: string;
  brand: string;
  rating: string;
  numReviews?: number;
  stock: number;
  isFeatured?: boolean;
  banner?: string;
}
