import { DrizzleProductRepository } from '@/infrastructure/db/repositories/product.repository';
import { DrizzleUserRepository } from '@/infrastructure/db/repositories/user.repository';
import { DrizzleCartRepository } from '@/infrastructure/db/repositories/cart.repository';
import { DrizzleOrderRepository } from '@/infrastructure/db/repositories/order.repository';
import { db as DrizzleDBInstance } from '@/infrastructure/db'; // Renamed to avoid conflict if 'db' is used as a var name

import type {
  RepositoryImplementation,
  KnownRepositoryInterfaces,
  ProductRepositoryInterface,
  UserRepositoryInterface,
  CartRepositoryInterface,
  OrderRepositoryInterface
} from './types';

export class RepositoryProvider {
  constructor(
    private implementation: RepositoryImplementation,
    private repositoriesCache: Record<string, KnownRepositoryInterfaces>,
    private dbInstance: typeof DrizzleDBInstance // Type for the Drizzle 'db' instance
  ) {}

  public getProductRepository(): ProductRepositoryInterface {
    const repoKey = 'productRepository';
    if (!this.repositoriesCache[repoKey]) {
      if (this.implementation === 'drizzle') {
        this.repositoriesCache[repoKey] = new DrizzleProductRepository(this.dbInstance);
      } else {
        throw new Error(`Unsupported repository implementation for ProductRepository: ${this.implementation}`);
      }
    }
    return this.repositoriesCache[repoKey] as ProductRepositoryInterface;
  }

  public getUserRepository(): UserRepositoryInterface {
    const repoKey = 'userRepository';
    if (!this.repositoriesCache[repoKey]) {
      if (this.implementation === 'drizzle') {
        this.repositoriesCache[repoKey] = new DrizzleUserRepository(this.dbInstance);
      } else {
        throw new Error(`Unsupported repository implementation for UserRepository: ${this.implementation}`);
      }
    }
    return this.repositoriesCache[repoKey] as UserRepositoryInterface;
  }

  public getCartRepository(): CartRepositoryInterface {
    const repoKey = 'cartRepository';
    if (!this.repositoriesCache[repoKey]) {
      if (this.implementation === 'drizzle') {
        this.repositoriesCache[repoKey] = new DrizzleCartRepository(this.dbInstance);
      } else {
        throw new Error(`Unsupported repository implementation for CartRepository: ${this.implementation}`);
      }
    }
    return this.repositoriesCache[repoKey] as CartRepositoryInterface;
  }

  public getOrderRepository(): OrderRepositoryInterface {
    const repoKey = 'orderRepository';
    if (!this.repositoriesCache[repoKey]) {
      if (this.implementation === 'drizzle') {
        this.repositoriesCache[repoKey] = new DrizzleOrderRepository(this.dbInstance);
      } else {
        throw new Error(`Unsupported repository implementation for OrderRepository: ${this.implementation}`);
      }
    }
    return this.repositoriesCache[repoKey] as OrderRepositoryInterface;
  }
}
