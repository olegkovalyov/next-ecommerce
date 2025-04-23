import { UserDto } from '@/domain/dtos';

export type UserWithRelations = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  password: string | null;
  role: string;
  address: string;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class UserMapper {
  public static toDto(user: UserWithRelations): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? undefined,
      password: user.password ?? undefined,
      role: user.role,
      address: user.address ?? undefined,
      paymentMethod: user.paymentMethod ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public static toPrisma(userDto: UserDto): {
    name: string;
    email: string;
    image?: string | null;
    password?: string | null;
    role: string;
    address?: string;
    paymentMethod?: string | null;
  } {
    return {
      name: userDto.name,
      email: userDto.email,
      image: userDto.image ?? null,
      password: userDto.password ?? null,
      role: userDto.role,
      address: userDto.address ?? '',
      paymentMethod: userDto.paymentMethod ?? null,
    };
  }
}
