import { db, DrizzleClient } from '@/infrastructure/db';
import * as schema from '@/infrastructure/db/schema';
import { DrizzleCartRepository } from '@/infrastructure/db/repositories/cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { UserEntity } from '@/domain/entities/user.entity';
import { ProductEntity } from '@/domain/entities/product.entity';
import { CartDto, CartItemDto, ProductDto, UserDto, UserRole } from '@/domain/dtos';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

// Helper function to create a UserDto
const createSampleUserDto = (idSuffix: string): UserDto => ({
  id: randomUUID(),
  email: `cart-user-${idSuffix}@example.com`,
  name: `Cart Test User ${idSuffix}`,
  password: 'password123',
  role: UserRole.USER,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper function to create a ProductDto
const createSampleProductDto = (idSuffix: string, price: number, stock: number): ProductDto => ({
  id: randomUUID(),
  name: `Test Cart Product ${idSuffix}`,
  slug: `test-cart-product-${idSuffix}`,
  description: 'A product for cart testing',
  price: price,
  images: ['/test-cart-image.jpg'],
  category: 'Test Category',
  stock: stock,
  rating: 4.5,
  brand: 'CartTestBrand',
  isFeatured: false,
  banner: null,
  numReviews: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('DrizzleCartRepository Integration Tests', () => {
  let testDb: DrizzleClient;

  beforeAll(async () => {
    testDb = db; 
    // cartRepository = new DrizzleCartRepository(testDb); 
  });

  beforeEach(async () => {
    // Clear tables in the correct order to avoid FK constraint violations.
    await testDb.delete(schema.orderItem);
    await testDb.delete(schema.order);
    await testDb.delete(schema.cartItem);
    await testDb.delete(schema.cart);
    await testDb.delete(schema.product);
    await testDb.delete(schema.user);
  });

  const createDbUser = async (txOrDb: DrizzleClient, dto: UserDto): Promise<UserEntity> => {
    const userEntityResult = await UserEntity.create(dto);
    if (!userEntityResult.success) throw userEntityResult.error;
    const user = userEntityResult.value;
    await txOrDb.insert(schema.user).values(user.toDto());
    return user;
  };

  const createDbProduct = async (txOrDb: DrizzleClient, dto: ProductDto): Promise<ProductEntity> => {
    const productEntityResult = await ProductEntity.create(dto);
    if (!productEntityResult.success) throw productEntityResult.error;
    const product = productEntityResult.value;
    await txOrDb.insert(schema.product).values({
      ...product.toDto(),
      price: product.price.toString(), 
      rating: product.rating.toString(), 
    });
    return product;
  };

  describe('save (create new cart)', () => {
    it('should successfully create an empty cart for a user', async () => {
      const cartRepository = new DrizzleCartRepository(testDb); 
      const testUserDto = createSampleUserDto('empty-cart');
      const user = await createDbUser(testDb, testUserDto);

      const cartId = randomUUID();
      const cartDto: CartDto = {
        id: cartId,
        userId: user.id,
        taxPercentage: 0,
        cartItemDtos: [],
      };

      const cartEntityResult = CartEntity.create(cartDto);
      expect(cartEntityResult.success).toBe(true);
      if (!cartEntityResult.success) throw cartEntityResult.error;
      const cartEntity = cartEntityResult.value;

      const saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;
      const savedCart = saveResult.value;

      expect(savedCart.id).toBe(cartId);
      expect(savedCart.userId).toBe(user.id);
      expect(savedCart.taxPercentage).toBe(0);
      expect(savedCart.getCartItemsArray()).toHaveLength(0);
      expect(savedCart.calculateItemsPrice()).toBe(0);
      expect(savedCart.calculateTaxPrice()).toBe(0);
      expect(savedCart.calculateTotalPrice()).toBe(0);

      const dbCart = await testDb.query.cart.findFirst({
        where: eq(schema.cart.id, cartId),
        with: { cartItems: true },
      });
      expect(dbCart).toBeDefined();
      expect(dbCart?.user_id).toBe(user.id);
      expect(dbCart?.cartItems).toBeDefined();
      expect(dbCart?.cartItems.length).toBe(0);
    });

    it('should successfully create a cart with one item', async () => {
      const cartRepository = new DrizzleCartRepository(testDb); 
      const testUserDto = createSampleUserDto('one-item-cart');
      const user = await createDbUser(testDb, testUserDto);
      const testProductDto = createSampleProductDto('p1-cart', 10.99, 100);
      const product = await createDbProduct(testDb, testProductDto);

      const cartId = randomUUID();
      const cartItemId = randomUUID();

      const cartItemDto: CartItemDto = {
        id: cartItemId,
        cartId: cartId,
        productId: product.id,
        quantity: 2,
        productDto: product.toDto(),
      };

      const cartDto: CartDto = {
        id: cartId,
        userId: user.id,
        taxPercentage: 10,
        cartItemDtos: [cartItemDto],
      };

      const cartEntityResult = CartEntity.create(cartDto);
      expect(cartEntityResult.success).toBe(true);
      if (!cartEntityResult.success) throw cartEntityResult.error;
      const cartEntity = cartEntityResult.value;

      const saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;
      const savedCart = saveResult.value;

      expect(savedCart.id).toBe(cartId);
      expect(savedCart.userId).toBe(user.id);
      expect(savedCart.taxPercentage).toBe(10);
      expect(savedCart.getCartItemsArray()).toHaveLength(1);

      const itemsPrice = 2 * 10.99;
      const taxPrice = itemsPrice * 0.10;
      const totalPrice = itemsPrice + taxPrice;

      expect(savedCart.calculateItemsPrice()).toBeCloseTo(itemsPrice);
      expect(savedCart.calculateTaxPrice()).toBeCloseTo(taxPrice);
      expect(savedCart.calculateTotalPrice()).toBeCloseTo(totalPrice);

      const savedCartItem = savedCart.getCartItemsArray()[0];
      expect(savedCartItem.id).toBe(cartItemId);
      expect(savedCartItem.productId).toBe(product.id);
      expect(savedCartItem.quantity).toBe(2);
      expect(savedCartItem.product.price).toBe(product.price);

      const dbCart = await testDb.query.cart.findFirst({
        where: eq(schema.cart.id, cartId),
        with: { cartItems: true },
      });
      expect(dbCart).toBeDefined();
      expect(dbCart?.user_id).toBe(user.id);
      expect(dbCart?.cartItems).toBeDefined();
      expect(dbCart?.cartItems.length).toBe(1);
      
      if (dbCart && dbCart.cartItems && dbCart.cartItems.length > 0) {
        const dbCartItem = dbCart.cartItems[0];
        expect(dbCartItem.product_id).toBe(product.id); 
        expect(dbCartItem.quantity).toBe(2);
        expect(parseFloat(dbCartItem.price!)).toBe(product.price); 
      } else {
        fail('Cart item not found in DB or cartItems array is empty');
      }
    });
  });

  describe('save (update existing cart)', () => {
    it('should update cart by adding items (0 to 2)', async () => {
      const cartRepository = new DrizzleCartRepository(testDb); 
      // 1. Setup: Create user and an empty cart
      const userDto = createSampleUserDto('update-0-to-2');
      const user = await createDbUser(testDb, userDto);
      const cartId = randomUUID();

      const initialCartEntityResult = CartEntity.create(
        {
          id: cartId,
          userId: user.id,
          taxPercentage: 5,
          cartItemDtos: [], 
        }
      );
      if (!initialCartEntityResult.success) {
        throw initialCartEntityResult.error; 
      }
      const cartEntity = initialCartEntityResult.value; 

      let saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // Verify empty cart saved
      let fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) {
        throw fetchedCartResult.error;
      }
      if (fetchedCartResult.value === null) {
        throw new Error('Test setup error: Cart should have been found after saving.');
      }
      let fetchedCart = fetchedCartResult.value; 
      expect(fetchedCart.getCartItemsArray()).toHaveLength(0);

      // 2. Action: Add 2 items to the cart entity and save
      const product1Dto = createSampleProductDto('prod1-for-update', 20.50, 5);
      const product1 = await createDbProduct(testDb, product1Dto); 
      const product2Dto = createSampleProductDto('prod2-for-update', 30.00, 3);
      const product2 = await createDbProduct(testDb, product2Dto); 

      const cartItem1Dto: CartItemDto = {
        id: randomUUID(),
        cartId: cartId,
        productId: product1.id,
        quantity: 1,
        productDto: product1.toDto(), 
      };

      const cartItem2Dto: CartItemDto = {
        id: randomUUID(),
        cartId: cartId,
        productId: product2.id,
        quantity: 2,
        productDto: product2.toDto(), 
      };

      const updatedCartEntityResult = CartEntity.create(
        {
          id: cartId, 
          userId: user.id,
          taxPercentage: 5, 
          cartItemDtos: [cartItem1Dto, cartItem2Dto], 
        }
      );
      if (!updatedCartEntityResult.success) {
        throw updatedCartEntityResult.error; 
      }
      const updatedCartEntity = updatedCartEntityResult.value; 

      saveResult = await cartRepository.save(updatedCartEntity); 
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // 3. Assertions: Verify cart now has 2 items
      fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) {
        throw fetchedCartResult.error;
      }
      if (fetchedCartResult.value === null) {
        throw new Error('Test assertion error: Cart should have been found after update.');
      }
      fetchedCart = fetchedCartResult.value; 
      expect(fetchedCart.getCartItemsArray()).toHaveLength(2);
      expect(fetchedCart.userId).toBe(user.id);
      expect(fetchedCart.taxPercentage).toBe(5);

      const dbItems = await testDb.query.cartItem.findMany({
        where: eq(schema.cartItem.cart_id, cartId),
        orderBy: schema.cartItem.product_id, 
      });
      expect(dbItems).toHaveLength(2);

      // Verify item 1
      const dbItem1 = dbItems.find(item => item.product_id === product1.id);
      expect(dbItem1).toBeDefined();
      expect(dbItem1?.quantity).toBe(1);
      expect(parseFloat(dbItem1!.price!)).toBe(product1.price);

      // Verify item 2
      const dbItem2 = dbItems.find(item => item.product_id === product2.id);
      expect(dbItem2).toBeDefined();
      expect(dbItem2?.quantity).toBe(2);
      expect(parseFloat(dbItem2!.price!)).toBe(product2.price);
    });

    it('should update cart by removing items (2 to 1)', async () => {
      const cartRepository = new DrizzleCartRepository(testDb); 
      // 1. Setup: Create user, products, and a cart with 2 items
      const userDto = createSampleUserDto('update-2-to-1');
      const user = await createDbUser(testDb, userDto);
      const cartId = randomUUID();

      const product1Dto = createSampleProductDto('prod1-for-remove', 25.00, 2);
      const product1 = await createDbProduct(testDb, product1Dto);
      const product2Dto = createSampleProductDto('prod2-for-remove', 35.00, 4);
      const product2 = await createDbProduct(testDb, product2Dto);

      const initialCartItem1Dto: CartItemDto = {
        id: randomUUID(),
        cartId: cartId,
        productId: product1.id,
        quantity: 1,
        productDto: product1.toDto(),
      };
      const initialCartItem2Dto: CartItemDto = {
        id: randomUUID(),
        cartId: cartId,
        productId: product2.id,
        quantity: 2,
        productDto: product2.toDto(),
      };

      const initialCartEntityResult = CartEntity.create({
        id: cartId,
        userId: user.id,
        taxPercentage: 8,
        cartItemDtos: [initialCartItem1Dto, initialCartItem2Dto],
      });
      if (!initialCartEntityResult.success) throw initialCartEntityResult.error;
      let cartEntity = initialCartEntityResult.value;

      let saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // Verify initial state (2 items)
      let fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) throw fetchedCartResult.error;
      if (!fetchedCartResult.value) throw new Error('Cart not found after initial save');
      let fetchedCart = fetchedCartResult.value;
      expect(fetchedCart.getCartItemsArray()).toHaveLength(2);

      // 2. Action: Update cart to have only 1 item (product1)
      const updatedCartItem1Dto: CartItemDto = {
        id: initialCartItem1Dto.id, 
        cartId: cartId,
        productId: product1.id,
        quantity: 1, 
        productDto: product1.toDto(),
      };

      const updatedCartEntityResult = CartEntity.create({
        id: cartId,
        userId: user.id,
        taxPercentage: 8,
        cartItemDtos: [updatedCartItem1Dto], 
      });
      if (!updatedCartEntityResult.success) throw updatedCartEntityResult.error;
      cartEntity = updatedCartEntityResult.value;

      saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // 3. Assertions: Verify cart now has 1 item
      fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) throw fetchedCartResult.error;
      if (!fetchedCartResult.value) throw new Error('Cart not found after update');
      fetchedCart = fetchedCartResult.value;
      expect(fetchedCart.getCartItemsArray()).toHaveLength(1);
      expect(fetchedCart.userId).toBe(user.id);
      expect(fetchedCart.taxPercentage).toBe(8);

      const dbItems = await testDb.query.cartItem.findMany({
        where: eq(schema.cartItem.cart_id, cartId),
      });
      expect(dbItems).toHaveLength(1);
      expect(dbItems[0].product_id).toBe(product1.id);
      expect(dbItems[0].quantity).toBe(1);
      expect(parseFloat(dbItems[0].price!)).toBe(product1.price);
    });

    it('should update an existing cart item (e.g., quantity change)', async () => {
      const cartRepository = new DrizzleCartRepository(testDb); 
      // 1. Setup: Create user, product, and a cart with one item
      const userDto = createSampleUserDto('update-item-quantity');
      const user = await createDbUser(testDb, userDto);
      const cartId = randomUUID();
      const productDto = createSampleProductDto('prod-for-qty-update', 40.00, 10);
      const product = await createDbProduct(testDb, productDto);

      const initialCartItemDto: CartItemDto = {
        id: randomUUID(),
        cartId: cartId,
        productId: product.id,
        quantity: 2,
        productDto: product.toDto(),
      };

      const initialCartEntityResult = CartEntity.create({
        id: cartId,
        userId: user.id,
        taxPercentage: 12,
        cartItemDtos: [initialCartItemDto],
      });
      if (!initialCartEntityResult.success) throw initialCartEntityResult.error;
      let cartEntity = initialCartEntityResult.value;

      let saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // Verify initial state
      let fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) throw fetchedCartResult.error;
      if (!fetchedCartResult.value) throw new Error('Cart not found after initial save');
      let fetchedCart = fetchedCartResult.value;
      expect(fetchedCart.getCartItemsArray()[0].quantity).toBe(2);

      // 2. Action: Update the quantity of the existing cart item
      const updatedCartItemDto: CartItemDto = {
        ...initialCartItemDto, 
        quantity: 5, 
      };

      const updatedCartEntityResult = CartEntity.create({
        id: cartId,
        userId: user.id,
        taxPercentage: 12, 
        cartItemDtos: [updatedCartItemDto],
      });
      if (!updatedCartEntityResult.success) throw updatedCartEntityResult.error;
      cartEntity = updatedCartEntityResult.value;

      saveResult = await cartRepository.save(cartEntity);
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) throw saveResult.error;

      // 3. Assertions: Verify cart item quantity is updated
      fetchedCartResult = await cartRepository.findById(cartId);
      if (!fetchedCartResult.success) throw fetchedCartResult.error;
      if (!fetchedCartResult.value) throw new Error('Cart not found after update');
      fetchedCart = fetchedCartResult.value;
      
      const cartItems = fetchedCart.getCartItemsArray();
      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].productId).toBe(product.id);
      expect(cartItems[0].quantity).toBe(5); 
      expect(cartItems[0].product.price).toBe(product.price); 

      // Also verify directly in DB
      const dbItem = await testDb.query.cartItem.findFirst({
        where: and(
          eq(schema.cartItem.cart_id, cartId),
          eq(schema.cartItem.product_id, product.id)
        ),
      });
      expect(dbItem).toBeDefined();
      expect(dbItem?.quantity).toBe(5);
      expect(parseFloat(dbItem!.price!)).toBe(product.price);
    });

    it('should update a cart property (e.g., taxPercentage)', async () => {
      await testDb.transaction(async (tx) => {
        const txCartRepository = new DrizzleCartRepository(tx);

        // 1. Setup: Create user, product, and a cart with one item and initial taxPercentage
        const userDto = createSampleUserDto('update-cart-tax-tx');
        const user = await createDbUser(tx, userDto); 
        const productDto = createSampleProductDto('p-tax-tx', 25.00, 5);
        const product = await createDbProduct(tx, productDto); 
        const cartId = randomUUID();
        const initialTaxPercentage = 5;

        const initialCartItemDto: CartItemDto = {
          id: randomUUID(),
          cartId: cartId,
          productId: product.id,
          quantity: 1,
          productDto: product.toDto(),
        };
        const initialCartDto: CartDto = {
          id: cartId,
          userId: user.id,
          taxPercentage: initialTaxPercentage,
          cartItemDtos: [initialCartItemDto],
        };

        const initialCartEntityResult = CartEntity.create(initialCartDto);
        expect(initialCartEntityResult.success).toBe(true);
        if (!initialCartEntityResult.success) throw initialCartEntityResult.error;
        let cartEntity = initialCartEntityResult.value;

        let saveResult = await txCartRepository.save(cartEntity); 
        expect(saveResult.success).toBe(true);
        if (!saveResult.success) throw saveResult.error;

        // 2. Action: Update taxPercentage on the cart entity and save
        const newTaxPercentage = 15;
        const updatedCartDto: CartDto = {
          ...cartEntity.toDto(), 
          taxPercentage: newTaxPercentage,
        };
        const updatedCartEntityResult = CartEntity.create(updatedCartDto);
        expect(updatedCartEntityResult.success).toBe(true);
        if (!updatedCartEntityResult.success) throw updatedCartEntityResult.error;
        cartEntity = updatedCartEntityResult.value;

        saveResult = await txCartRepository.save(cartEntity); 
        expect(saveResult.success).toBe(true); 
        if (!saveResult.success) throw saveResult.error;

        // 3. Assertions: Verify cart's taxPercentage is updated
        const loadedCartResult = await txCartRepository.findById(cartId); 
        expect(loadedCartResult.success).toBe(true);
        if (!loadedCartResult.success) throw loadedCartResult.error;
        const loadedCart = loadedCartResult.value;

        expect(loadedCart.taxPercentage).toBe(newTaxPercentage);
        expect(loadedCart.userId).toBe(user.id);
        expect(loadedCart.getCartItemsArray().length).toBe(1); 

        // Verify in DB using the transaction client 'tx'
        const dbCart = await tx.query.cart.findFirst({
          where: eq(schema.cart.id, cartId),
        });
        expect(dbCart).toBeDefined();
        expect(dbCart?.tax_percentage).toBe(newTaxPercentage);
      });
    });
  });
});
