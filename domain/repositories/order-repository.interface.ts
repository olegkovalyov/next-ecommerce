import { OrderEntity } from '../entities/order.entity';
import { Result } from '@/lib/result';

export interface OrderRepositoryInterface {
  findById(id: string): Promise<Result<OrderEntity>>;

  findByUserId(userId: string): Promise<Result<OrderEntity[]>>;

  save(order: OrderEntity): Promise<Result<OrderEntity>>;

  delete(id: string): Promise<Result<OrderEntity>>;
}
