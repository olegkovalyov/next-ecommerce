import { ProductService } from '@/application/services/product/product.service';
import { ProductRepositoryInterface } from '@/domain/repositories/product-repository.interface';
import { UserRepositoryInterface } from '@/domain/repositories/user-repository.interface';
import { CartRepositoryInterface } from '@/domain/repositories/cart-repository.interface';
import { OrderRepositoryInterface } from '@/domain/repositories/order-repository.interface';

import { DrizzleProductRepository } from '@/infrastructure/db/repositories/product.repository';
import { DrizzleUserRepository } from '@/infrastructure/db/repositories/user.repository';
import { DrizzleCartRepository } from '@/infrastructure/db/repositories/cart.repository';
import { DrizzleOrderRepository } from '@/infrastructure/db/repositories/order.repository';

import { db } from '@/infrastructure/db';

export type RepositoryImplementation = 'drizzle';

export class Container {
  private static instance: Container;
  private serviceCache: Map<string, any> = new Map();
  private repositories: Record<string, any> = {};
  
  private constructor(private implementation: RepositoryImplementation = 'drizzle') {
    this.initializeRepositories();
  }
  
  public static getInstance(implementation?: RepositoryImplementation): Container {
    if (!Container.instance) {
      Container.instance = new Container(implementation);
    }
    
    if (implementation && Container.instance.implementation !== implementation) {
      Container.instance.implementation = implementation;
      Container.instance.initializeRepositories();
      Container.instance.serviceCache.clear();
    }
    
    return Container.instance;
  }
  
  private initializeRepositories(): void {
    // Drizzle repositories for all entities
    this.repositories.productRepository = new DrizzleProductRepository(db);
    this.repositories.userRepository = new DrizzleUserRepository(db);
    this.repositories.cartRepository = new DrizzleCartRepository(db);
    this.repositories.orderRepository = new DrizzleOrderRepository(db);
  }
  
  // Product service
  public getProductService(): ProductService {
    const cacheKey = 'productService';
    
    if (!this.serviceCache.has(cacheKey)) {
      this.serviceCache.set(
        cacheKey, 
        new ProductService(this.repositories.productRepository)
      );
    }
    
    return this.serviceCache.get(cacheKey);
  }
  
  // Repository getters
  public getProductRepository(): ProductRepositoryInterface {
    return this.repositories.productRepository;
  }

  public getUserRepository(): UserRepositoryInterface {
    return this.repositories.userRepository;
  }

  public getCartRepository(): CartRepositoryInterface {
    return this.repositories.cartRepository;
  }

  public getOrderRepository(): OrderRepositoryInterface {
    return this.repositories.orderRepository;
  }
} 