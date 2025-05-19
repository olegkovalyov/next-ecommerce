import { ProductEntity } from '@/domain/entities/product.entity.ts';
import { ProductDto } from '@/domain/dtos';
import { Result, success, failure } from '@/lib/result';
import { DrizzleClient } from '@/infrastructure/db';
import * as schema from '../../schema/product.ts';
import { eq, and, or, gte, lte, asc, desc, count, SQL, sql, Column } from 'drizzle-orm';
import { ProductRepositoryInterface, ProductSearchCriteria, ProductSortField } from '@/domain/repositories/product-repository.interface.ts';

export class DrizzleProductRepository implements ProductRepositoryInterface {
  constructor(private readonly db: DrizzleClient) {
  }

  async findById(id: string): Promise<Result<ProductEntity>> {
    try {
      const products = await this.db.select().from(schema.product).where(eq(schema.product.id, id)).limit(1);

      if (!products.length) {
        return failure(new Error('Product not found'));
      }
      const productData = products[0];
      if (productData.created_at === null || productData.updated_at === null) {
        return failure(new Error('Product data is missing date fields'));
      }

      const productDto = this.mapToDto(productData);
      return ProductEntity.fromDto(productDto);
    } catch (error) {
      console.error('Failed to find product by ID:', error);
      return failure(new Error('Failed to find product'));
    }
  }

  async findBySlug(slug: string): Promise<Result<ProductEntity>> {
    try {
      const products = await this.db.select().from(schema.product).where(eq(schema.product.slug, slug)).limit(1);

      if (!products.length) {
        return failure(new Error('Product not found'));
      }
      const productData = products[0];
      if (productData.created_at === null || productData.updated_at === null) {
        return failure(new Error('Product data is missing date fields'));
      }
      const productDto = this.mapToDto(productData);
      return ProductEntity.fromDto(productDto);
    } catch (error) {
      console.error('Failed to find product by slug:', error);
      return failure(new Error('Failed to find product'));
    }
  }

  async save(product: ProductEntity): Promise<Result<ProductEntity>> {
    try {
      const productDto = product.toDto();
      const dbProduct = this.mapFromDto(productDto);

      const existingProductResult = await this.db.query.product.findFirst({
        where: eq(schema.product.id, productDto.id),
      });

      if (existingProductResult) {
        await this.db.update(schema.product)
          .set(dbProduct)
          .where(eq(schema.product.id, productDto.id));
      } else {
        await this.db.insert(schema.product).values({
          id: productDto.id,
          ...dbProduct,
        });
      }
      const savedProduct = await this.db.query.product.findFirst({ where: eq(schema.product.id, productDto.id) });
      if (!savedProduct || savedProduct.created_at === null || savedProduct.updated_at === null) {
        return failure(new Error('Failed to retrieve saved product or date fields are missing'));
      }
      return ProductEntity.fromDto(this.mapToDto(savedProduct));
    } catch (error) {
      console.error('Failed to save product:', error);
      return failure(new Error('Failed to save product'));
    }
  }

  async delete(id: string): Promise<Result<ProductEntity>> {
    try {
      const productResult = await this.findById(id);
      if (!productResult.success) {
        return productResult;
      }
      await this.db.delete(schema.product).where(eq(schema.product.id, id));
      return success(productResult.value);
    } catch (error) {
      console.error('Failed to delete product:', error);
      return failure(new Error('Failed to delete product'));
    }
  }

  async findAll(criteria?: ProductSearchCriteria): Promise<Result<ProductEntity[], Error>> {
    try {
      const conditions: SQL[] = [];

      if (criteria) {
        if (criteria.query) {
          const queryLower = criteria.query.toLowerCase();
          const searchPattern = `%${queryLower}%`;

          // Assert that each part of the 'or' condition is SQL
          const nameCondition = sql`lower(
          ${schema.product.name}
          )
          like
          ${searchPattern}` as SQL;
          const descriptionCondition = sql`lower(
          ${schema.product.description}
          )
          like
          ${searchPattern}` as SQL;

          const combinedOrCondition = or(nameCondition, descriptionCondition);

          if (combinedOrCondition) {
            conditions.push(combinedOrCondition);
          }
        }
        if (criteria.slug) {
          conditions.push(eq(schema.product.slug, criteria.slug));
        }
        if (criteria.category) {
          conditions.push(eq(schema.product.category, criteria.category));
        }
        if (criteria.brand) {
          conditions.push(eq(schema.product.brand, criteria.brand));
        }
        if (criteria.minPrice !== undefined) {
          conditions.push(gte(schema.product.price, criteria.minPrice.toString()));
        }
        if (criteria.maxPrice !== undefined) {
          conditions.push(lte(schema.product.price, criteria.maxPrice.toString()));
        }
        if (criteria.minStock !== undefined) {
          conditions.push(gte(schema.product.stock, criteria.minStock));
        }
        if (criteria.isFeatured !== undefined) {
          conditions.push(eq(schema.product.is_featured, criteria.isFeatured));
        }
        if (criteria.minRating !== undefined) {
          conditions.push(gte(schema.product.rating, criteria.minRating.toString()));
        }
      }

      let query = this.db.select().from(schema.product).$dynamic();

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const sortOrders: SQL[] = [];
      if (criteria?.sortBy && criteria.sortBy.length > 0) {
        const columnMap: Record<ProductSortField, Column | undefined> = {
          'name': schema.product.name,
          'price': schema.product.price,
          'createdAt': schema.product.created_at,
          'updatedAt': schema.product.updated_at,
          'stock': schema.product.stock,
          'rating': schema.product.rating,
        };

        for (const sortCriterion of criteria.sortBy) {
          const sortFieldSql = columnMap[sortCriterion.field];
          if (sortFieldSql) {
            sortOrders.push(sortCriterion.order === 'asc' ? asc(sortFieldSql) : desc(sortFieldSql));
          }
        }
      }
      if (sortOrders.length > 0) {
        query = query.orderBy(...sortOrders);
      }

      if (criteria?.limit !== undefined) {
        query = query.limit(criteria.limit);
        if (criteria?.offset !== undefined) {
          query = query.offset(criteria.offset);
        }
      }

      const dbProducts = await query;
      const productEntities: ProductEntity[] = [];

      for (const dbProduct of dbProducts) {
        if (dbProduct.created_at === null || dbProduct.updated_at === null) {
          console.warn(`Product with ID ${dbProduct.id} has null date fields, skipping.`);
          continue;
        }
        const productDto = this.mapToDto(dbProduct);
        const entityResult = ProductEntity.fromDto(productDto);
        if (entityResult.success) {
          productEntities.push(entityResult.value);
        } else {
          console.warn(`Failed to map product with ID ${dbProduct.id} to entity: ${entityResult.error.message}`);
        }
      }
      return success(productEntities);
    } catch (error) {
      console.error('Failed to find all products:', error);
      return failure(new Error('Failed to find all products'));
    }
  }

  async countAll(criteria?: Omit<ProductSearchCriteria, 'limit' | 'offset' | 'sortBy'>): Promise<Result<number, Error>> {
    try {
      const conditions: SQL[] = [];

      if (criteria) {
        if (criteria.query) {
          const queryLower = criteria.query.toLowerCase();
          const searchPattern = `%${queryLower}%`;

          // Assert that each part of the 'or' condition is SQL
          const nameCondition = sql`lower(
          ${schema.product.name}
          )
          like
          ${searchPattern}` as SQL;
          const descriptionCondition = sql`lower(
          ${schema.product.description}
          )
          like
          ${searchPattern}` as SQL;

          const combinedOrCondition = or(nameCondition, descriptionCondition);

          if (combinedOrCondition) {
            conditions.push(combinedOrCondition);
          }
        }
        if (criteria.slug) {
          conditions.push(eq(schema.product.slug, criteria.slug));
        }
        if (criteria.category) {
          conditions.push(eq(schema.product.category, criteria.category));
        }
        if (criteria.brand) {
          conditions.push(eq(schema.product.brand, criteria.brand));
        }
        if (criteria.minPrice !== undefined) {
          conditions.push(gte(schema.product.price, criteria.minPrice.toString()));
        }
        if (criteria.maxPrice !== undefined) {
          conditions.push(lte(schema.product.price, criteria.maxPrice.toString()));
        }
        if (criteria.minStock !== undefined) {
          conditions.push(gte(schema.product.stock, criteria.minStock));
        }
        if (criteria.isFeatured !== undefined) {
          conditions.push(eq(schema.product.is_featured, criteria.isFeatured));
        }
        if (criteria.minRating !== undefined) {
          conditions.push(gte(schema.product.rating, criteria.minRating.toString()));
        }
      }

      let query = this.db.select({ value: count() }).from(schema.product).$dynamic();

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query;
      return success(result[0]?.value || 0);
    } catch (error) {
      console.error('Failed to count products:', error);
      return failure(new Error('Failed to count products'));
    }
  }

  private mapToDto(dbProduct: typeof schema.product.$inferSelect): ProductDto {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      slug: dbProduct.slug,
      category: dbProduct.category,
      brand: dbProduct.brand,
      description: dbProduct.description,
      stock: dbProduct.stock,
      images: dbProduct.images,
      isFeatured: dbProduct.is_featured,
      banner: dbProduct.banner,
      price: Number(dbProduct.price),
      rating: Number(dbProduct.rating),
      numReviews: dbProduct.num_reviews,
      createdAt: dbProduct.created_at as Date,
      updatedAt: dbProduct.updated_at as Date,
    };
  }

  private mapFromDto(productDto: ProductDto): Omit<typeof schema.product.$inferInsert, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: productDto.name,
      slug: productDto.slug,
      category: productDto.category,
      brand: productDto.brand,
      description: productDto.description,
      stock: productDto.stock,
      images: productDto.images,
      is_featured: productDto.isFeatured,
      banner: productDto.banner,
      price: productDto.price.toString(),
      rating: productDto.rating.toString(),
      num_reviews: productDto.numReviews,
    };
  }
}
