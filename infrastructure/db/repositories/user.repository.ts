import { UserEntity } from '@/domain/entities/user.entity';
import { UserDto } from '@/domain/dtos';
import { Result, success, failure } from '@/lib/result';
import { DrizzleClient } from '@/infrastructure/db';
import * as schema from '../schema/user';
import { eq } from 'drizzle-orm';
import { UserRepositoryInterface } from '@/domain/repositories/user-repository.interface';

export class DrizzleUserRepository implements UserRepositoryInterface {
  constructor(private readonly db: DrizzleClient) {
  }

  async findById(id: string): Promise<Result<UserEntity>> {
    try {
      const users = await this.db.select().from(schema.user).where(eq(schema.user.id, id)).limit(1);

      if (!users.length) {
        return failure(new Error('User not found'));
      }

      const userDto = this.mapToDto(users[0]);
      return UserEntity.fromDto(userDto);
    } catch (error) {
      console.error('Failed to find user by ID:', error);
      return failure(new Error('Failed to find user'));
    }
  }

  async findByEmail(email: string): Promise<Result<UserEntity>> {
    try {
      const users = await this.db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);

      if (!users.length) {
        return failure(new Error('User not found'));
      }

      const userDto = this.mapToDto(users[0]);
      return UserEntity.fromDto(userDto);
    } catch (error) {
      console.error('Failed to find user by email:', error);
      return failure(new Error('Failed to find user'));
    }
  }

  async save(user: UserEntity): Promise<Result<UserEntity>> {
    try {
      const userDto = user.toDto();
      const dbUser = this.mapFromDto(userDto);

      // Check if user exists
      const existingUserResult = await this.findById(userDto.id);

      if (existingUserResult.success) {
        // Update existing user
        const dataToUpdate = { ...dbUser, updated_at: new Date() };
        await this.db.update(schema.user)
          .set(dataToUpdate)
          .where(eq(schema.user.id, userDto.id));
      } else {
        // Create new user
        await this.db.insert(schema.user).values({
          id: userDto.id,
          ...dbUser,
        });
      }

      // Return the updated/created user
      return await this.findById(userDto.id);
    } catch (error) {
      console.error('Failed to save user:', error);
      return failure(new Error('Failed to save user'));
    }
  }

  async delete(id: string): Promise<Result<UserEntity>> {
    try {
      // First check if user exists
      const userResult = await this.findById(id);

      if (!userResult.success) {
        return failure(new Error('User not found'));
      }

      // Delete the user
      await this.db.delete(schema.user).where(eq(schema.user.id, id));

      // Return the deleted user
      return success(userResult.value);
    } catch (error) {
      console.error('Failed to delete user:', error);
      return failure(new Error('Failed to delete user'));
    }
  }

  private mapToDto(dbUser: typeof schema.user.$inferSelect): UserDto {
    return {
      id: dbUser.id,
      name: dbUser.name || '',
      email: dbUser.email,
      image: dbUser.image || null,
      password: dbUser.password || '',
      role: dbUser.role || 'user',
      address: dbUser.address ? JSON.stringify(dbUser.address) : null,
      paymentMethod: dbUser.payment_method || null,
      createdAt: dbUser.created_at || new Date(),
      updatedAt: dbUser.updated_at || new Date(),
    };
  }

  private mapFromDto(userDto: UserDto): Omit<typeof schema.user.$inferInsert, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: userDto.name,
      email: userDto.email,
      image: userDto.image,
      password: userDto.password,
      role: userDto.role,
      address: userDto.address ? JSON.parse(userDto.address) : null,
      payment_method: userDto.paymentMethod,
    };
  }
}
