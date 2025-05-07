import { UserEntity } from '../user.entity';
import { UserDto } from '@/domain/dtos';

describe('UserEntity', () => {
  const mockUserDto: UserDto = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    image: null,
    address: '123 Test St, Test City, TS, Test Country, 12345',
    paymentMethod: 'card',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('fromDto', () => {
    it('should create a UserEntity from a valid DTO', () => {
      const result = UserEntity.fromDto(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const user = result.value;
        expect(user).toBeInstanceOf(UserEntity);
        expect(user.toDto()).toEqual(mockUserDto);
      }
    });

    it('should fail when ID is missing', () => {
      const invalidDto = { ...mockUserDto, id: '' };
      const result = UserEntity.fromDto(invalidDto as UserDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have an ID for fromDto mapping');
      }
    });

    it('should fail when name is missing', () => {
      const invalidDto = { ...mockUserDto, name: '' };
      const result = UserEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have a name');
      }
    });

    it('should fail when email is missing', () => {
      const invalidDto = { ...mockUserDto, email: '' };
      const result = UserEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have an email');
      }
    });

    it('should fail when password is missing', () => {
      const invalidDto = { ...mockUserDto, password: '' };
      const result = UserEntity.fromDto(invalidDto as UserDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have a password string');
      }
    });

    it('should fail when role is missing', () => {
      const invalidDto = { ...mockUserDto, role: '' };
      const result = UserEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have a role');
      }
    });
  });

  describe('create', () => {
    it('should create a UserEntity from a valid DTO', async () => {
      const result = await UserEntity.create(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const user = result.value;
        expect(user).toBeInstanceOf(UserEntity);

        const dtoFromEntity = user.toDto();
        // Compare all fields except password
        expect(dtoFromEntity.id).toBe(mockUserDto.id);
        expect(dtoFromEntity.name).toBe(mockUserDto.name);
        expect(dtoFromEntity.email).toBe(mockUserDto.email);
        expect(dtoFromEntity.image).toBe(mockUserDto.image);
        expect(dtoFromEntity.role).toBe(mockUserDto.role);
        expect(dtoFromEntity.address).toBe(mockUserDto.address);
        expect(dtoFromEntity.paymentMethod).toBe(mockUserDto.paymentMethod);
        // Compare date ISO strings to avoid potential instance mismatches
        expect(dtoFromEntity.createdAt.toISOString()).toBe(mockUserDto.createdAt.toISOString());
        expect(dtoFromEntity.updatedAt.toISOString()).toBe(mockUserDto.updatedAt.toISOString());

        // Check password separately
        expect(dtoFromEntity.password).not.toBe(mockUserDto.password!); // Hashed vs Plain
        expect(dtoFromEntity.password!.length).toBeGreaterThan(mockUserDto.password!.length);
        expect(await user.comparePassword(mockUserDto.password!)).toBe(true); // Check if plain password matches hashed
      }
    });

    it('should fail when required fields are missing', async () => {
      const invalidDto = { ...mockUserDto, name: '' };
      const result = await UserEntity.create(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User must have a name');
      }
    });
  });

  describe('toDto', () => {
    it('should convert UserEntity to UserDto', () => {
      const result = UserEntity.fromDto(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const user = result.value;
        const dto = user.toDto();
        expect(dto).toEqual(mockUserDto);
      }
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const adminDto = { ...mockUserDto, role: 'admin' };
      const result = UserEntity.fromDto(adminDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isAdmin()).toBe(true);
      }
    });

    it('should return false for non-admin role', () => {
      const result = UserEntity.fromDto(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isAdmin()).toBe(false);
      }
    });
  });

  describe('hasAddress', () => {
    it('should return true when address is present', () => {
      const result = UserEntity.fromDto(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasAddress()).toBe(true);
      }
    });

    it('should return false when address is null', () => {
      const noAddressDto = { ...mockUserDto, address: null };
      const result = UserEntity.fromDto(noAddressDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasAddress()).toBe(false);
      }
    });
  });

  describe('hasPaymentMethod', () => {
    it('should return true when payment method is present', () => {
      const result = UserEntity.fromDto(mockUserDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasPaymentMethod()).toBe(true);
      }
    });

    it('should return false when payment method is empty', () => {
      const noPaymentDto = { ...mockUserDto, paymentMethod: '' };
      const result = UserEntity.fromDto(noPaymentDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasPaymentMethod()).toBe(false);
      }
    });
  });
});
