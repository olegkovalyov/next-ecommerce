import { randomUUID } from 'crypto';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

import { DrizzleProductRepository } from '../product.repository';
import { ProductEntity } from '@/domain/entities/product.entity.ts';
import { ProductDto } from '@/domain/dtos';
import * as allSchemas from '../../schema';
import { product as productTable } from '../../schema';

const DATABASE_URL_TEST = process.env.DATABASE_URL;

if (!DATABASE_URL_TEST) {
  throw new Error(
    'DATABASE_URL for the test environment is not set. Ensure that jest.setup.ts loads it correctly.'
  );
}

describe('DrizzleProductRepository Integration Tests', () => {
  let db: PostgresJsDatabase<typeof allSchemas>;
  let productRepository: DrizzleProductRepository;
  let pgClient: postgres.Sql;

  beforeAll(() => {
    pgClient = postgres(DATABASE_URL_TEST);
    db = drizzle(pgClient, { schema: allSchemas });
    productRepository = new DrizzleProductRepository(db);
  });

  afterAll(async () => {
    await pgClient.end();
  });

  beforeEach(async () => {
    // Clear tables in the correct order to avoid FK constraint violations
    // Ensure allSchemas is used as defined in this file (db = drizzle(pgClient, { schema: allSchemas });)
    await db.delete(allSchemas.orderItem);
    await db.delete(allSchemas.order); 
    await db.delete(allSchemas.cartItem);
    await db.delete(allSchemas.cart);
    await db.delete(allSchemas.product); // productTable is an alias for allSchemas.product
    await db.delete(allSchemas.user);
  });

  const createSampleProductDto = (overrides: Partial<ProductDto> = {}): ProductDto => {
    const id = overrides.id || randomUUID();
    const now = new Date();
    return {
      id,
      name: `Test Product ${id.substring(0, 4)}`,
      slug: `test-product-${id.substring(0, 4)}`,
      description: 'A great test product',
      price: 100.0,
      images: ['image1.jpg', 'image2.jpg'],
      category: 'Test Category',
      brand: 'Test Brand',
      stock: 10,
      rating: 4.5,
      numReviews: 10,
      isFeatured: false,
      banner: null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };
  };

  describe('save', () => {
    it('should save a new product to the database', async () => {
      const productDto = createSampleProductDto();
      const productEntityResult = ProductEntity.fromDto(productDto);
      if (!productEntityResult.success) {
        fail(productEntityResult.error.message || 'Failed to create ProductEntity for saving new product');
      }
      const productEntity = productEntityResult.value;

      const saveResult = await productRepository.save(productEntity);

      expect(saveResult.success).toBe(true);
      if (!saveResult.success) { // Type guard
        fail('saveResult for new product should be successful');
      }

      const savedEntity = saveResult.value;
      expect(savedEntity).toBeInstanceOf(ProductEntity);
      expect(savedEntity.id).toBe(productEntity.id);
      expect(savedEntity.name).toBe(productEntity.name);
      expect(savedEntity.price).toBe(productEntity.price);

      // Timestamp checks for new product
      expect(savedEntity.createdAt).toBeInstanceOf(Date);
      expect(savedEntity.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(savedEntity.createdAt.getTime() - productDto.createdAt!.getTime())).toBeLessThan(2000); // Allow 2s leeway
      expect(Math.abs(savedEntity.updatedAt.getTime() - productDto.updatedAt!.getTime())).toBeLessThan(2000); // Allow 2s leeway

      // Verify in DB
      const dbProduct = await db.query.product.findFirst({ where: eq(productTable.id, productEntity.id) });
      expect(dbProduct).toBeDefined();
      expect(dbProduct?.id).toBe(productEntity.id);
      expect(dbProduct?.name).toBe(productEntity.name);
      expect(dbProduct?.price).toBe(productEntity.price.toFixed(2)); // Drizzle returns strings for numeric with scale
      expect(new Date(dbProduct!.created_at!).getTime()).toBeGreaterThan(productDto.createdAt!.getTime() - 2000);
      expect(new Date(dbProduct!.updated_at!).getTime()).toBeGreaterThan(productDto.updatedAt!.getTime() - 2000);
    });

    it('should update an existing product in the database', async () => {
      // 1. Create and save an initial product
      const initialProductDto: ProductDto = {
        id: randomUUID(),
        name: `Initial Product for Update`,
        slug: `initial-product-for-update-${randomUUID()}`,
        description: 'An initial product that will be updated',
        price: 200.0,
        images: ['initial.jpg'],
        category: 'Initial Category',
        brand: 'Initial Brand',
        stock: 20,
        rating: 3.0,
        numReviews: 5,
        isFeatured: false,
        banner: null,
        createdAt: new Date(), // This will be set by DB on creation
        updatedAt: new Date(), // This will be set by DB on creation
      };

      let productEntityResult = ProductEntity.fromDto(initialProductDto);
      if (!productEntityResult.success) {
        fail(productEntityResult.error.message || 'Failed to create initial ProductEntity for update test');
      }
      const initialEntityToSave = productEntityResult.value;

      const saveInitialResult = await productRepository.save(initialEntityToSave);
      if (!saveInitialResult.success) {
        fail(saveInitialResult.error.message || 'Failed to save initial product for update test');
      }
      const savedInitialEntity = saveInitialResult.value;

      // 2. Modify the product for update
      const updatedName = 'Updated Product Name';
      const updatedPrice = 250.50;

      // Create a DTO for update, using the ID and createdAt from the saved initial entity
      const productToUpdateDto: ProductDto = {
        ...initialProductDto, // spread initial to keep other fields, but override specific ones
        id: savedInitialEntity.id, // CRITICAL: Use the ID of the saved product
        name: updatedName,
        price: updatedPrice,
        // createdAt should effectively be from savedInitialEntity.createdAt for accurate comparison later
        // but ProductEntity.fromDto will use what's in DTO. We'll compare against savedInitialEntity.createdAt
        createdAt: savedInitialEntity.createdAt,
        updatedAt: new Date(), // This DTO's updatedAt will be ignored by $onUpdate
      };

      productEntityResult = ProductEntity.fromDto(productToUpdateDto);
      if (!productEntityResult.success) {
        fail(productEntityResult.error.message || 'Failed to create ProductEntity for update operation');
      }
      const entityToUpdate = productEntityResult.value;

      const timeBeforeActualUpdate = new Date();

      // 3. Save (update) the product
      const finalUpdateResult = await productRepository.save(entityToUpdate);
      expect(finalUpdateResult.success).toBe(true);
      if (!finalUpdateResult.success) { // Type guard for TypeScript
        fail('finalUpdateResult should be successful');
      }
      const finalUpdatedEntity = finalUpdateResult.value;

      // Assertions
      expect(finalUpdatedEntity.id).toBe(savedInitialEntity.id);
      expect(finalUpdatedEntity.name).toBe(updatedName);
      expect(finalUpdatedEntity.price).toBe(updatedPrice);

      // Check createdAt remains consistent with the initially saved product (within tolerance)
      expect(finalUpdatedEntity.createdAt).toBeInstanceOf(Date);
      expect(Math.abs(finalUpdatedEntity.createdAt.getTime() - savedInitialEntity.createdAt.getTime())).toBeLessThan(2000);

      // Check updatedAt reflects the time of this update operation
      expect(finalUpdatedEntity.updatedAt).toBeInstanceOf(Date);
      expect(finalUpdatedEntity.updatedAt.getTime()).toBeGreaterThanOrEqual(timeBeforeActualUpdate.getTime() - 2000); // Allow 2s for operation
      expect(finalUpdatedEntity.updatedAt.getTime()).toBeGreaterThan(savedInitialEntity.updatedAt.getTime());

      // 4. Verify in DB
      const dbUpdatedProduct = await db.query.product.findFirst({ where: eq(productTable.id, savedInitialEntity.id) });
      expect(dbUpdatedProduct).toBeDefined();
      expect(dbUpdatedProduct?.id).toBe(savedInitialEntity.id);
      expect(dbUpdatedProduct?.name).toBe(updatedName);
      expect(dbUpdatedProduct?.price).toBe(updatedPrice.toFixed(2));
      expect(new Date(dbUpdatedProduct!.created_at!).getTime()).toBeGreaterThan(savedInitialEntity.createdAt.getTime() - 2000);
      expect(new Date(dbUpdatedProduct!.updated_at!).getTime()).toBeGreaterThanOrEqual(timeBeforeActualUpdate.getTime() - 2000);
    });
  });

  describe('findById', () => {
    it('should find a product by its ID if it exists', async () => {
      // 1. Create and save a product
      const productDto = createSampleProductDto();
      const productEntityResult = ProductEntity.fromDto(productDto);
      if (!productEntityResult.success) {
        fail('Failed to create ProductEntity for findById test');
      }
      const productToSave = productEntityResult.value;
      const saveResult = await productRepository.save(productToSave);
      if (!saveResult.success) {
        fail('Failed to save product for findById test');
      }
      const savedProduct = saveResult.value;

      // 2. Find the product by ID
      const findResult = await productRepository.findById(savedProduct.id);

      // 3. Assertions
      expect(findResult.success).toBe(true);
      if (!findResult.success) { // Type guard
        fail('findResult should be successful when product exists');
      }
      const foundProduct = findResult.value;
      expect(foundProduct).toBeInstanceOf(ProductEntity);
      expect(foundProduct.id).toBe(savedProduct.id);
      expect(foundProduct.name).toBe(savedProduct.name);
      expect(foundProduct.price).toBe(savedProduct.price);
      expect(foundProduct.slug).toBe(savedProduct.slug);
      // Timestamps (with tolerance)
      expect(foundProduct.createdAt).toBeInstanceOf(Date);
      expect(Math.abs(foundProduct.createdAt.getTime() - savedProduct.createdAt.getTime())).toBeLessThan(2000);
      expect(foundProduct.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(foundProduct.updatedAt.getTime() - savedProduct.updatedAt.getTime())).toBeLessThan(2000);
    });

    it('should return failure if product with the given ID does not exist', async () => {
      const nonExistentId = randomUUID();
      const findResult = await productRepository.findById(nonExistentId);

      expect(findResult.success).toBe(false);
      // Optionally, check the error type or message if your repository returns specific errors
      // For now, we confirm it's a failure, implying the product was not found.
      if (!findResult.success) {
        expect(findResult.error).toBeInstanceOf(Error);
        // A more specific error check could be added here, e.g.:
        // expect(findResult.error.message).toContain('Product not found');
      }
    });
  });

  describe('findBySlug', () => {
    it('should find a product by its slug if it exists', async () => {
      // 1. Create and save a product
      const productDto = createSampleProductDto({ slug: `unique-slug-${randomUUID()}` });
      const productEntityResult = ProductEntity.fromDto(productDto);
      if (!productEntityResult.success) {
        fail('Failed to create ProductEntity for findBySlug test');
      }
      const productToSave = productEntityResult.value;
      const saveResult = await productRepository.save(productToSave);
      if (!saveResult.success) {
        fail('Failed to save product for findBySlug test');
      }
      const savedProduct = saveResult.value;

      // 2. Find the product by slug
      const findResult = await productRepository.findBySlug(savedProduct.slug);

      // 3. Assertions
      expect(findResult.success).toBe(true);
      if (!findResult.success) { // Type guard
        fail('findResult should be successful when product with slug exists');
      }
      const foundProduct = findResult.value;
      expect(foundProduct).toBeInstanceOf(ProductEntity);
      expect(foundProduct.id).toBe(savedProduct.id);
      expect(foundProduct.name).toBe(savedProduct.name);
      expect(foundProduct.price).toBe(savedProduct.price);
      expect(foundProduct.slug).toBe(savedProduct.slug);
      // Timestamps (with tolerance)
      expect(foundProduct.createdAt).toBeInstanceOf(Date);
      expect(Math.abs(foundProduct.createdAt.getTime() - savedProduct.createdAt.getTime())).toBeLessThan(2000);
      expect(foundProduct.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(foundProduct.updatedAt.getTime() - savedProduct.updatedAt.getTime())).toBeLessThan(2000);
    });

    it('should return failure if product with the given slug does not exist', async () => {
      const nonExistentSlug = `non-existent-slug-${randomUUID()}`;
      const findResult = await productRepository.findBySlug(nonExistentSlug);

      expect(findResult.success).toBe(false);
      if (!findResult.success) {
        expect(findResult.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('findAll', () => {
    it('should return all products when multiple products exist', async () => {
      // 1. Create and save multiple products
      const productDto1 = createSampleProductDto({ name: 'Product Alpha' });
      const productDto2 = createSampleProductDto({ name: 'Product Beta', price: 150.75 });
      const productDto3 = createSampleProductDto({ name: 'Product Gamma', category: 'New Category' });

      const productsToSaveResults = await Promise.all([
        ProductEntity.fromDto(productDto1),
        ProductEntity.fromDto(productDto2),
        ProductEntity.fromDto(productDto3),
      ]);

      for (const result of productsToSaveResults) {
        if (!result.success) fail('Failed to create product entity for findAll test');
        const saveResult = await productRepository.save(result.value);
        if (!saveResult.success) fail('Failed to save product for findAll test');
      }

      // 2. Call findAll
      const findAllResult = await productRepository.findAll();

      // 3. Assertions
      expect(findAllResult.success).toBe(true);
      if (!findAllResult.success) {
        fail('findAll should be successful when products exist');
      }
      const foundProducts = findAllResult.value;
      expect(foundProducts).toBeInstanceOf(Array);
      expect(foundProducts.length).toBe(3);

      // Verify details of each product (optional, but good for sanity check)
      // We'll check if the names are present, assuming DTO creation and save were correct
      const names = foundProducts.map(p => p.name).sort();
      expect(names).toEqual(['Product Alpha', 'Product Beta', 'Product Gamma'].sort());

      // Check one product more thoroughly as a sample
      const foundProductAlpha = foundProducts.find(p => p.name === 'Product Alpha');
      expect(foundProductAlpha).toBeDefined();
      expect(foundProductAlpha?.price).toBe(productDto1.price);
      expect(foundProductAlpha?.category).toBe(productDto1.category);
    });

    it('should return an empty array when no products exist', async () => {
      // Ensure the table is empty (already handled by beforeEach, but explicit check is fine)
      const productsInDb = await db.select().from(productTable);
      expect(productsInDb.length).toBe(0);

      const findAllResult = await productRepository.findAll();

      expect(findAllResult.success).toBe(true);
      if (!findAllResult.success) {
        fail('findAll should be successful even when no products exist');
      }
      const foundProducts = findAllResult.value;
      expect(foundProducts).toBeInstanceOf(Array);
      expect(foundProducts.length).toBe(0);
    });
  });

  describe('countAll', () => {
    it('should return the correct count when multiple products exist', async () => {
      // 1. Create and save multiple products
      const productDto1 = createSampleProductDto({ name: 'Count Product A' });
      const productDto2 = createSampleProductDto({ name: 'Count Product B' });

      const productsToSaveResults = await Promise.all([
        ProductEntity.fromDto(productDto1),
        ProductEntity.fromDto(productDto2),
      ]);

      for (const result of productsToSaveResults) {
        if (!result.success) fail('Failed to create product entity for countAll test');
        const saveResult = await productRepository.save(result.value);
        if (!saveResult.success) fail('Failed to save product for countAll test');
      }

      // 2. Call countAll
      const countAllResult = await productRepository.countAll();

      // 3. Assertions
      expect(countAllResult.success).toBe(true);
      if (!countAllResult.success) {
        fail('countAll should be successful when products exist');
      }
      expect(countAllResult.value).toBe(2);
    });

    it('should return 0 when no products exist', async () => {
      // Ensure the table is empty
      const productsInDb = await db.select().from(productTable);
      expect(productsInDb.length).toBe(0);

      const countAllResult = await productRepository.countAll();

      expect(countAllResult.success).toBe(true);
      if (!countAllResult.success) {
        fail('countAll should be successful even when no products exist');
      }
      expect(countAllResult.value).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete an existing product and return success', async () => {
      // 1. Create and save a product
      const productDto = createSampleProductDto();
      const productEntityResult = ProductEntity.fromDto(productDto);
      if (!productEntityResult.success) {
        fail('Failed to create ProductEntity for delete test');
      }
      const productToSave = productEntityResult.value;
      const saveResult = await productRepository.save(productToSave);
      if (!saveResult.success) {
        fail('Failed to save product for delete test');
      }
      const savedProduct = saveResult.value;

      // 2. Delete the product
      const deleteResult = await productRepository.delete(savedProduct.id);

      // 3. Assert deletion was successful
      expect(deleteResult.success).toBe(true);

      // 4. Verify product is no longer findable
      const findResult = await productRepository.findById(savedProduct.id);
      expect(findResult.success).toBe(false);

      // 5. Verify in DB (optional, but good for thoroughness)
      const dbProduct = await db.query.product.findFirst({ where: eq(productTable.id, savedProduct.id) });
      expect(dbProduct).toBeUndefined();
    });

    it('should return failure when trying to delete a non-existent product', async () => {
      const nonExistentId = randomUUID();
      const deleteResult = await productRepository.delete(nonExistentId);

      expect(deleteResult.success).toBe(false);
      if (!deleteResult.success) {
        expect(deleteResult.error).toBeInstanceOf(Error);
        // Depending on repository implementation, you might check for a specific error:
      }
    });
  });
});
