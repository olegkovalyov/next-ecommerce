export interface UserDto {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  password?: string | null;
  role: string;
  address?: any | null;
  paymentMethod?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
