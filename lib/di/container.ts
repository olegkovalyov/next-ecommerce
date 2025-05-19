import { db } from '@/infrastructure/db';
import { RepositoryProvider } from './repository.provider';
import { ServiceProvider } from './service.provider';
import type {
  RepositoryImplementation,
  KnownRepositoryInterfaces,
  KnownServiceInterfaces,
  ProductRepositoryInterface,
  UserRepositoryInterface,
  CartRepositoryInterface,
  OrderRepositoryInterface,
  ProductServiceInterface, CartServiceInterface,
} from './types';

export class Container {
  private static instance: Container;

  private implementation: RepositoryImplementation;
  private repositoriesCache: Record<string, KnownRepositoryInterfaces> = {};
  private serviceCache: Map<string, KnownServiceInterfaces> = new Map();

  private repositoryProvider: RepositoryProvider;
  private serviceProvider: ServiceProvider;

  private constructor(implementation: RepositoryImplementation = 'drizzle') {
    this.implementation = implementation;
    // Initialize providers
    this.repositoryProvider = new RepositoryProvider(this.implementation, this.repositoriesCache, db);
    this.serviceProvider = new ServiceProvider(this.serviceCache, this.repositoryProvider);
  }

  public static getInstance(implementation?: RepositoryImplementation): Container {
    if (!Container.instance) {
      Container.instance = new Container(implementation);
    } else if (implementation && Container.instance.implementation !== implementation) {
      // If implementation changes, re-initialize the container with the new one.
      // This will create new provider instances with the new implementation and clear caches.
      Container.instance.implementation = implementation; // Update implementation first
      Container.instance.repositoriesCache = {}; // Clear cache
      Container.instance.serviceCache.clear(); // Clear cache

      // Re-create providers with the new implementation and cleared caches
      Container.instance.repositoryProvider = new RepositoryProvider(
        Container.instance.implementation,
        Container.instance.repositoriesCache,
        db
      );
      Container.instance.serviceProvider = new ServiceProvider(
        Container.instance.serviceCache,
        Container.instance.repositoryProvider
      );
    }
    return Container.instance;
  }

  // Delegate repository getters to RepositoryProvider
  public getProductRepository(): ProductRepositoryInterface {
    return this.repositoryProvider.getProductRepository();
  }

  public getUserRepository(): UserRepositoryInterface {
    return this.repositoryProvider.getUserRepository();
  }

  public getCartRepository(): CartRepositoryInterface {
    return this.repositoryProvider.getCartRepository();
  }

  public getOrderRepository(): OrderRepositoryInterface {
    return this.repositoryProvider.getOrderRepository();
  }

  // Delegate service getters to ServiceProvider
  public getProductService(): ProductServiceInterface {
    return this.serviceProvider.getProductService();
  }

  public getCartService(): CartServiceInterface {
    return this.serviceProvider.getCartService();
  }
}
