import type { ProductRepositoryInterface } from '@/domain/repositories/product-repository.interface';
import type { UserRepositoryInterface } from '@/domain/repositories/user-repository.interface';
import type { CartRepositoryInterface } from '@/domain/repositories/cart-repository.interface';
import type { OrderRepositoryInterface } from '@/domain/repositories/order-repository.interface';
import type { ProductServiceInterface } from '@/application/product/services/product-service.interface.ts';
import type { CartServiceInterface } from '@/application/cart/services/cart-service.interface';

// Re-export the imported interfaces to make them available to other modules in this directory
export type {
    ProductRepositoryInterface,
    UserRepositoryInterface,
    CartRepositoryInterface,
    OrderRepositoryInterface,
    ProductServiceInterface,
    CartServiceInterface
};

export type RepositoryImplementation = 'drizzle';

// Union type for all known repository interfaces
export type KnownRepositoryInterfaces =
  | ProductRepositoryInterface
  | UserRepositoryInterface
  | CartRepositoryInterface
  | OrderRepositoryInterface;

// Union type for all known service interfaces
// Add other service interfaces here if they are created
export type KnownServiceInterfaces =
  | ProductServiceInterface
  | CartServiceInterface;
