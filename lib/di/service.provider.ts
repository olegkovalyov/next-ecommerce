import { ProductService } from '@/application/services/product/product.service';
import type {
  KnownServiceInterfaces,
  ProductServiceInterface
} from './types';
import type { RepositoryProvider } from './repository.provider'; // To get repositories

export class ServiceProvider {
  constructor(
    private serviceCache: Map<string, KnownServiceInterfaces>,
    private repositoryProvider: RepositoryProvider // Pass the repository provider instance
  ) {}

  public getProductService(): ProductServiceInterface {
    const cacheKey = 'productService';
    if (!this.serviceCache.has(cacheKey)) {
      const productService = new ProductService(
        this.repositoryProvider.getProductRepository() // Get repository via provider
      );
      this.serviceCache.set(cacheKey, productService as KnownServiceInterfaces);
    }
    return this.serviceCache.get(cacheKey) as ProductServiceInterface;
  }
  
  // Add other service getters here if needed, e.g.:
  // public getUserService(): UserServiceInterface {
  //   const cacheKey = 'userService';
  //   if (!this.serviceCache.has(cacheKey)) {
  //     const userService = new UserService(this.repositoryProvider.getUserRepository());
  //     this.serviceCache.set(cacheKey, userService as KnownServiceInterfaces);
  //   }
  //   return this.serviceCache.get(cacheKey) as UserServiceInterface;
  // }
}
