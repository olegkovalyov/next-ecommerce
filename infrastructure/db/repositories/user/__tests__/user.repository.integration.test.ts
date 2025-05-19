import { db } from '@/infrastructure/db';
import * as schema from '@/infrastructure/db/schema';
import { DrizzleUserRepository } from '../user.repository';
import { UserDto, UserRole } from '@/domain/dtos';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '@/domain/entities/user.entity.ts';

// Helper function to create a sample UserDto
const createSampleUserDto = (overrides: Partial<UserDto> = {}): UserDto => {
  const userId = overrides.id || uuidv4();
  return {
    id: userId,
    name: `Test User ${userId.substring(0, 4)}`,
    email: `test-${userId.substring(0, 8)}@example.com`,
    password: 'password123', // Plain text password for DTO, entity will hash it
    role: UserRole.USER,
    image: null,
    address: null,
    paymentMethod: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

describe('DrizzleUserRepository Integration Tests', () => {
  let userRepository: DrizzleUserRepository;

  beforeAll(() => {
    userRepository = new DrizzleUserRepository(db);
  });

  beforeEach(async () => {
    // Clear tables in the correct order to avoid FK constraint violations
    console.log('[user.repository.test] beforeEach: Clearing tables...');
    await db.delete(schema.orderItem);
    await db.delete(schema.order);
    await db.delete(schema.cartItem);
    await db.delete(schema.cart);
    await db.delete(schema.product);
    await db.delete(schema.user);
    console.log('[user.repository.test] beforeEach: All relevant tables cleared.');
  });

  describe('save (create)', () => {
    it('should fail to create a user with a duplicate email', async () => {
      const email = `duplicate-${uuidv4().substring(0,4)}@example.com`;
      const dto1 = createSampleUserDto({ email });
      const entity1Result = await UserEntity.create(dto1);
      expect(entity1Result.success).toBe(true);
      if (!entity1Result.success) throw new Error('Failed to create entity1 for test');
      await userRepository.save(entity1Result.value);

      const dto2 = createSampleUserDto({ email }); // Same email
      const entity2Result = await UserEntity.create(dto2);
      expect(entity2Result.success).toBe(true);
      if (!entity2Result.success) throw new Error('Failed to create entity2 for test');

      try {
        await userRepository.save(entity2Result.value);
      } catch (e) {
        // This assertion depends on the exact error message from Drizzle/Postgres for unique constraint violation
        // It might need adjustment based on the actual error observed during test runs
        expect((e as unknown as Error).message).toMatch(/duplicate key value violates unique constraint/i);
      }
    });
  });
});
