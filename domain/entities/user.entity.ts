import { UserDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';

export class UserEntity {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly image: string;
  public readonly role: string;
  public readonly address: string;
  public readonly paymentMethod: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(userData: UserDto) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.image = userData.image ?? '';
    this.role = userData.role;
    this.address = userData.address ?? '';
    this.paymentMethod = userData.paymentMethod ?? '';
    this.createdAt = userData.createdAt ?? new Date();
    this.updatedAt = userData.updatedAt ?? new Date();
  }

  public static fromDto(userData: UserDto): Result<UserEntity> {
    try {
      if (!userData.id) {
        return failure(new Error('User must have an ID'));
      }

      if (!userData.email) {
        return failure(new Error('User must have an email'));
      }

      const user = new UserEntity(userData);
      return success(user);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create user from DTO'));
    }
  }

  public static create(userData: UserDto): Result<UserEntity> {
    return UserEntity.fromDto(userData);
  }

  public toDto(): UserDto {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      image: this.image,
      role: this.role,
      address: this.address,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Business logic methods
  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public hasAddress(): boolean {
    return this.address !== null;
  }

  public hasPaymentMethod(): boolean {
    return this.paymentMethod !== null;
  }
}
