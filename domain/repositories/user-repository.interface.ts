import { UserEntity } from '../entities/user.entity';
import { Result } from '@/lib/result';

export interface UserRepositoryInterface {
  findById(id: string): Promise<Result<UserEntity>>;

  findByEmail(email: string): Promise<Result<UserEntity>>;

  save(user: UserEntity): Promise<Result<UserEntity>>;

  delete(id: string): Promise<Result<UserEntity>>;
}
