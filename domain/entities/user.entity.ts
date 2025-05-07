import { UserDto, UserRole } from '@/domain/dtos';
import { failure, success, Result } from '@/lib/result';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class UserEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly image: string | null,
    public readonly password: string, // Will store the hashed password
    public readonly role: string,
    public readonly address: string | null,
    public readonly paymentMethod: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDto(dto: UserDto): Result<UserEntity> {
    if (!dto.id) {
      return failure(new Error('User must have an ID for fromDto mapping'));
    }
    if (!dto.name) {
      return failure(new Error('User must have a name'));
    }
    if (!dto.email) {
      return failure(new Error('User must have an email'));
    }
    if (!dto.password) {
      // For fromDto, password might already be hashed or is being set from a trusted source
      return failure(new Error('User must have a password string'));
    }
    if (!dto.role) {
      return failure(new Error('User must have a role'));
    }
    if (!dto.createdAt) {
        return failure(new Error('User must have createdAt timestamp'));
    }
    if (!dto.updatedAt) {
        return failure(new Error('User must have updatedAt timestamp'));
    }

    return success(
      new UserEntity(
        dto.id,
        dto.name,
        dto.email,
        dto.image ?? null,
        dto.password, // Assumes password in DTO is as-is (e.g., already hashed or being set directly)
        dto.role,
        dto.address ?? null,
        dto.paymentMethod ?? null,
        dto.createdAt,
        dto.updatedAt
      )
    );
  }

  static async create(dto: UserDto): Promise<Result<UserEntity>> {
    if (!dto.name) {
      return failure(new Error('User must have a name'));
    }
    if (!dto.email) {
      return failure(new Error('User must have an email'));
    }
    if (!dto.password) {
      return failure(new Error('User must have a password'));
    }
    // Basic password length validation (can be enhanced)
    if (dto.password.length < 6) {
        return failure(new Error('Password must be at least 6 characters long'));
    }

    const role = dto.role || UserRole.USER; // Default role if not provided

    try {
      const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
      const now = new Date();
      const entity = new UserEntity(
        dto.id || uuidv4(),
        dto.name,
        dto.email,
        dto.image ?? null,
        hashedPassword,
        role,
        dto.address ?? null,
        dto.paymentMethod ?? null,
        dto.createdAt || now,
        dto.updatedAt || now
      );
      return success(entity);
    } catch (error) {
      console.error('Error during UserEntity.create password hashing:', error);
      return failure(new Error('Failed to create user due to password hashing error.'));
    }
  }

  toDto(): UserDto {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      image: this.image,
      password: this.password, // This will be the hashed password
      role: this.role,
      address: this.address,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    if (!plainPassword || !this.password) {
        return false;
    }
    try {
        return await bcrypt.compare(plainPassword, this.password);
    } catch (error) {
        console.error("Error comparing password:", error);
        return false;
    }
  }

  async updatePassword(newPlainPassword: string): Promise<Result<UserEntity>> {
    if (!newPlainPassword || newPlainPassword.length < 6) {
        return failure(new Error('New password must be at least 6 characters long.'));
    }
    try {
        const newHashedPassword = await bcrypt.hash(newPlainPassword, SALT_ROUNDS);
        // Return a new UserEntity instance with the updated password and updatedAt timestamp
        return success(new UserEntity(
            this.id,
            this.name,
            this.email,
            this.image,
            newHashedPassword,
            this.role,
            this.address,
            this.paymentMethod,
            this.createdAt, // createdAt remains the same
            new Date()       // new updatedAt timestamp
        ));
    } catch (error) {
        console.error("Error updating password:", error);
        return failure(new Error('Password hashing failed during update.'));
    }
  }

  // Business logic methods
  public isAdmin(): boolean {
    return this.role === 'admin'; // Ensure UserRole.ADMIN is used if it's an enum
  }

  public hasAddress(): boolean {
    return this.address !== null && this.address !== '';
  }

  public hasPaymentMethod(): boolean {
    return this.paymentMethod !== null && this.paymentMethod !== '';
  }
}
