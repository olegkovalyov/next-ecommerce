import { UserDto } from '@/domain/dtos';
import { failure, success } from '@/lib/result';

export class UserEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly image: string | null,
    public readonly password: string,
    public readonly role: string,
    public readonly address: string | null,
    public readonly paymentMethod: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDto(dto: UserDto) {
    if (!dto.id) {
      return failure(new Error('User must have an ID'));
    }
    if (!dto.name) {
      return failure(new Error('User must have a name'));
    }
    if (!dto.email) {
      return failure(new Error('User must have an email'));
    }
    if (!dto.password) {
      return failure(new Error('User must have a password'));
    }
    if (!dto.role) {
      return failure(new Error('User must have a role'));
    }

    return success(
      new UserEntity(
        dto.id,
        dto.name,
        dto.email,
        dto.image ?? null,
        dto.password,
        dto.role,
        dto.address ?? null,
        dto.paymentMethod ?? null,
        dto.createdAt,
        dto.updatedAt
      )
    );
  }

  static create(dto: UserDto) {
    return this.fromDto(dto);
  }

  toDto(): UserDto {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      image: this.image,
      password: this.password,
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
    return this.address !== null && this.address !== '';
  }

  public hasPaymentMethod(): boolean {
    return this.paymentMethod !== null && this.paymentMethod !== '';
  }
}
