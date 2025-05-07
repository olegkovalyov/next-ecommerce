import { createContext, useContext, ReactNode } from 'react';
import { ProductRepositoryInterface } from '@/domain/repositories/product-repository.interface';
import { UserRepositoryInterface } from '@/domain/repositories/user-repository.interface';
import { CartRepositoryInterface } from '@/domain/repositories/cart-repository.interface';
import { OrderRepositoryInterface } from '@/domain/repositories/order-repository.interface';

import { DrizzleProductRepository } from '@/infrastructure/db/repositories/product.repository';
import { DrizzleUserRepository } from '@/infrastructure/db/repositories/user.repository';
import { DrizzleCartRepository } from '@/infrastructure/db/repositories/cart.repository';
import { DrizzleOrderRepository } from '@/infrastructure/db/repositories/order.repository';

import { db } from '@/infrastructure/db';

interface RepositoryContextType {
  productRepository: ProductRepositoryInterface;
  userRepository: UserRepositoryInterface;
  cartRepository: CartRepositoryInterface;
  orderRepository: OrderRepositoryInterface;
}

// Default repositories
const defaultRepositories: RepositoryContextType = {
  productRepository: new DrizzleProductRepository(db),
  userRepository: new DrizzleUserRepository(db),
  cartRepository: new DrizzleCartRepository(db),
  orderRepository: new DrizzleOrderRepository(db),
};

const RepositoryContext = createContext<RepositoryContextType>(defaultRepositories);

export const useRepositories = () => useContext(RepositoryContext);

interface RepositoryProviderProps {
  children: ReactNode;
}

export const RepositoryProvider = ({ 
  children
}: RepositoryProviderProps) => {
  return (
    <RepositoryContext.Provider value={defaultRepositories}>
      {children}
    </RepositoryContext.Provider>
  );
}; 