import { ProductService } from '@/application/product/services/product.service.ts';
import CartService from '@/application/cart/services/cart.service';
import type {
  KnownServiceInterfaces,
  ProductServiceInterface,
  CartServiceInterface
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

  public getCartService(): CartServiceInterface {
    const cacheKey = 'cartService';
    if (!this.serviceCache.has(cacheKey)) {
      const cartService = new CartService();
      this.serviceCache.set(cacheKey, cartService as KnownServiceInterfaces);
    }
    return this.serviceCache.get(cacheKey) as CartServiceInterface;
  }
}
