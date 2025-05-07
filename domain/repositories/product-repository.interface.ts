import { ProductEntity } from '../entities/product.entity';
import { Result } from '@/lib/result';

export type ProductSortField = 'name' | 'price' | 'createdAt' | 'updatedAt' | 'stock' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface ProductSortCriteria {
  field: ProductSortField;
  order: SortOrder;
}

export interface ProductSearchCriteria {
  query?: string;
  slug?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  isFeatured?: boolean;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: ProductSortCriteria[];
}

export interface ProductRepositoryInterface {
  findById(id: string): Promise<Result<ProductEntity>>;

  findBySlug(slug: string): Promise<Result<ProductEntity>>;

  save(product: ProductEntity): Promise<Result<ProductEntity>>;

  delete(id: string): Promise<Result<ProductEntity>>;

  findAll(criteria?: ProductSearchCriteria): Promise<Result<ProductEntity[]>>;

  countAll(criteria?: Omit<ProductSearchCriteria, 'limit' | 'offset' | 'sortBy'>): Promise<Result<number>>;
}
