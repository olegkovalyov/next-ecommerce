import { UserEntity } from '@/domain/entities/user.entity';
import { UserMapper, UserWithRelations } from './mappers/user.mapper';
import { failure, Result } from '@/lib/result';
import { PrismaClient } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Result<UserEntity>> {
    try {
      const data = await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });

      return UserEntity.fromDto(UserMapper.toDto(data as unknown as UserWithRelations));
    } catch (error) {
      return failure(new Error('User not found'));
    }
  }

  async findByEmail(email: string): Promise<Result<UserEntity>> {
    try {
      const data = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!data) {
        return failure(new Error('User not found'));
      }

      return UserEntity.fromDto(UserMapper.toDto(data as unknown as UserWithRelations));
    } catch (error) {
      return failure(new Error('User not found'));
    }
  }

  async save(user: UserEntity): Promise<Result<UserEntity>> {
    try {
      const prismaData = UserMapper.toPrisma(user.toDto());

      const data = await this.prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          ...prismaData,
        },
        update: prismaData,
      });

      return UserEntity.fromDto(UserMapper.toDto(data as unknown as UserWithRelations));
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to save user:', error);
      }
      return failure(new Error('Failed to save user'));
    }
  }

  async delete(id: string): Promise<Result<UserEntity>> {
    try {
      const user = await this.findById(id);

      if (!user.success) {
        return user;
      }

      await this.prisma.user.delete({
        where: { id },
      });
      return user;
    } catch (error) {
      return failure(new Error('Failed to delete user'));
    }
  }
} 