import { Result } from '@/lib/result';
import { ProductEntity } from '@/domain/entities/product.entity';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartDto } from '@/domain/dtos';

export interface CartStrategyInterface {

  addItem(cartDto: CartDto, product: ProductEntity, quantity?: number): Promise<Result<CartEntity>>;

  removeItem(cartDto: CartDto, productId: string, quantity?: number): Promise<Result<CartEntity>>;

  clearCart(cartDto: CartDto): Promise<Result<CartEntity>>;
}
