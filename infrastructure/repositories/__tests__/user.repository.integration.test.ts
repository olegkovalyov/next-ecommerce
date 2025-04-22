import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../user.repository';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserDto } from '@/domain/dtos';
import crypto from 'crypto';

describe('UserRepository', () => {
  let prisma: PrismaClient;
  let repository: UserRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = new UserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password123',
          role: 'user',
          image: null,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            country: 'Test Country',
            zipCode: '12345'
          },
          paymentMethod: 'card',
        },
      });

      try {
        // Act
        const result = await repository.findById(testUserId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.id).toBe(testUserId);
          expect(result.value.name).toBe(user.name);
          expect(result.value.email).toBe(user.email);
        }
      } finally {
        // Cleanup
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should return failure when user not found', async () => {
      const nonExistentUserId = crypto.randomUUID();
      const result = await repository.findById(nonExistentUserId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User not found');
      }
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const testEmail = `test-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: testEmail,
          password: 'password123',
          role: 'user',
          image: null,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            country: 'Test Country',
            zipCode: '12345'
          },
          paymentMethod: 'card',
        },
      });

      try {
        // Act
        const result = await repository.findByEmail(testEmail);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.email).toBe(testEmail);
        }
      } finally {
        // Cleanup
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should return failure when user not found by email', async () => {
      const nonExistentEmail = `non-existent-${Date.now()}@example.com`;
      const result = await repository.findByEmail(nonExistentEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('User not found');
      }
    });
  });

  describe('save', () => {
    it('should create a new user', async () => {
      // Arrange
      const newUserId = crypto.randomUUID();
      const now = new Date();
      const newUserData = {
        id: newUserId,
        name: 'New User',
        email: `new-${Date.now()}@example.com`,
        password: 'newpassword123',
        role: 'user',
        image: null,
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'NS',
          country: 'New Country',
          zipCode: '54321'
        },
        paymentMethod: 'paypal',
        createdAt: now,
        updatedAt: now,
      };

      // Convert to UserDto format
      const newUserDto: UserDto = {
        ...newUserData,
        address: newUserData.address ? {
          street: newUserData.address.street,
          city: newUserData.address.city,
          state: newUserData.address.state,
          country: newUserData.address.country,
          zipCode: newUserData.address.zipCode
        } : null
      };

      const newUser = UserEntity.fromDto(newUserDto);
      if (!newUser.success) {
        throw newUser.error;
      }

      try {
        // Act
        const result = await repository.save(newUser.value);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.id).toBe(newUserData.id);
          expect(result.value.name).toBe(newUserData.name);
          expect(result.value.email).toBe(newUserData.email);
        }

        // Verify in database
        const savedUser = await prisma.user.findUnique({
          where: { id: newUserData.id },
        });
        expect(savedUser).not.toBeNull();
        expect(savedUser?.name).toBe(newUserData.name);
      } finally {
        // Cleanup
        await prisma.user.deleteMany({ where: { id: newUserId } });
      }
    });

    it('should update an existing user', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const now = new Date();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password123',
          role: 'user',
          image: null,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            country: 'Test Country',
            zipCode: '12345'
          },
          paymentMethod: 'card',
        },
      });

      try {
        // Convert to UserDto format
        const userDto: UserDto = {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          image: user.image,
          address: user.address ? {
            street: (user.address as any).street,
            city: (user.address as any).city,
            state: (user.address as any).state,
            country: (user.address as any).country,
            zipCode: (user.address as any).zipCode
          } : null,
          paymentMethod: user.paymentMethod,
          createdAt: now,
          updatedAt: now,
        };

        const testUser = UserEntity.fromDto(userDto);
        if (!testUser.success) {
          throw testUser.error;
        }

        // Arrange
        const updatedUser = UserEntity.fromDto({
          ...testUser.value.toDto(),
          name: 'Updated Name',
        });
        if (!updatedUser.success) {
          throw updatedUser.error;
        }

        // Act
        const result = await repository.save(updatedUser.value);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.name).toBe('Updated Name');
        }

        // Verify in database
        const savedUser = await prisma.user.findUnique({
          where: { id: testUserId },
        });
        expect(savedUser?.name).toBe('Updated Name');
      } finally {
        // Cleanup
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password123',
          role: 'user',
          image: null,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            country: 'Test Country',
            zipCode: '12345'
          },
          paymentMethod: 'card',
        },
      });

      try {
        // Act
        const result = await repository.delete(testUserId);

        // Assert
        expect(result.success).toBe(true);

        // Verify in database
        const deletedUser = await prisma.user.findUnique({
          where: { id: testUserId },
        });
        expect(deletedUser).toBeNull();
      } finally {
        // Cleanup
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should return failure when trying to delete non-existent user', async () => {
      const nonExistentUserId = crypto.randomUUID();
      const result = await repository.delete(nonExistentUserId);
      expect(result.success).toBe(false);
    });
  });
});
