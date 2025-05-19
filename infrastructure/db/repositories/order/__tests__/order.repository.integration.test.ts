import { db } from '@/infrastructure/db';
import * as schema from '@/infrastructure/db/schema';
import { DrizzleOrderRepository } from '../order.repository';
import { OrderEntity } from '@/domain/entities/order.entity.ts';
import { UserEntity } from '@/domain/entities/user.entity.ts';
import { ProductEntity } from '@/domain/entities/product.entity.ts';
import { OrderDto, OrderItemDto, ProductDto, UserDto, OrderStatus } from '@/domain/dtos';
import { ShippingAddress } from '@/lib/contracts/shipping-address.ts';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

describe('DrizzleOrderRepository Integration Tests', () => {
  let orderRepository: DrizzleOrderRepository;
  let testUser: UserEntity;
  let testProduct: ProductEntity;

  // Helper to create a user directly in DB for tests
  const createDbUser = async (userData: Partial<UserDto> = {}): Promise<UserEntity> => {
    const email = userData.email || `testuser-${randomUUID()}@example.com`;
    const userDto: UserDto = {
      id: userData.id || randomUUID(),
      name: userData.name || 'Test User',
      email: email,
      password: userData.password || 'password123', // Must be provided for UserEntity.create
      image: userData.image || null,
      role: userData.role || 'user',
      address: userData.address || null,
      paymentMethod: userData.paymentMethod || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    };

    // Pass the DTO directly to UserEntity.create
    const userEntityResult = await UserEntity.create(userDto);
    if (!userEntityResult.success) throw userEntityResult.error;
    const user = userEntityResult.value;

    // When inserting into DB, use the DTO from the created entity
    // as it will have the hashed password and generated fields.
    await db.insert(schema.user).values(user.toDto());
    return user;
  };

  // Helper to create a product directly in DB for tests
  const createDbProduct = async (productData: Partial<ProductDto> = {}): Promise<ProductEntity> => {
    const productDto: ProductDto = {
      id: productData.id || randomUUID(),
      name: productData.name || 'Test Product',
      slug: productData.slug || `test-product-${randomUUID()}`,
      category: productData.category || 'Test Category',
      brand: productData.brand || 'Test Brand',
      description: productData.description || 'Test Description',
      stock: productData.stock || 10,
      price: productData.price || 100,
      images: productData.images || ['test-image.jpg'],
      rating: productData.rating || 4.5,
      numReviews: productData.numReviews || 10,
      isFeatured: productData.isFeatured || false,
      banner: productData.banner || null,
      createdAt: productData.createdAt || new Date(),
      updatedAt: productData.updatedAt || new Date(),
    };
    const productEntityResult = ProductEntity.create(productDto);
    if (!productEntityResult.success) throw productEntityResult.error;
    const product = productEntityResult.value;
    await db.insert(schema.product).values({
      ...product.toDto(),
      price: product.price.toString(), // Ensure price is string for DB
      rating: product.rating.toString(), // Ensure rating is string for DB
    });
    return product;
  };

  beforeAll(async () => {
    orderRepository = new DrizzleOrderRepository(db);
  });

  beforeEach(async () => {
    // Clear all related tables in the correct order to avoid FK violations
    await db.delete(schema.orderProductSnapshot);
    await db.delete(schema.orderItem);
    await db.delete(schema.order);
    await db.delete(schema.cartItem);
    await db.delete(schema.cart);
    await db.delete(schema.product);
    await db.delete(schema.user);
  });

  describe('save (create new order)', () => {
    it('should successfully create a new order with order items and product snapshots', async () => {
      // 1. Arrange
      testUser = await createDbUser({ email: `user-create-order-${randomUUID()}@example.com`});
      testProduct = await createDbProduct({ name: `Product For Create Order ${randomUUID()}`});

      const orderId = randomUUID();
      const shippingAddress: ShippingAddress = {
        fullName: 'Test Customer',
        streetAddress: '123 Test St',
        city: 'Testville',
        postalCode: '12345',
        country: 'Testland',
      };

      const orderItemDto1: OrderItemDto = {
        id: randomUUID(),
        orderId: orderId,
        productId: testProduct.id,
        quantity: 2,
        price: testProduct.price,
        name: testProduct.name,
        slug: testProduct.slug,
        image: testProduct.images[0],
        productDto: testProduct.toDto(),
        productSnapshot: testProduct.toDto(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const itemsPrice = orderItemDto1.price * orderItemDto1.quantity;
      const shippingPrice = 5.00;
      const taxPrice = itemsPrice * 0.1;
      const totalPrice = itemsPrice + shippingPrice + taxPrice;

      const orderDto: OrderDto = {
        id: orderId,
        userId: testUser.id,
        shippingAddress: shippingAddress,
        paymentMethod: 'Credit Card',
        paymentResult: null,
        itemsPrice: parseFloat(itemsPrice.toFixed(2)),
        shippingPrice: parseFloat(shippingPrice.toFixed(2)),
        taxPrice: parseFloat(taxPrice.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        status: OrderStatus.PENDING_PAYMENT,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        trackingNumber: null,
        customerNotes: null,
        internalNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderItemDtos: [orderItemDto1],
      };

      const orderEntityResult = await OrderEntity.create(orderDto);
      if (!orderEntityResult.success) {
        expect(orderEntityResult.success).toBe(true);
        throw new Error('OrderEntity.create failed: ' + (orderEntityResult.error?.message || 'Unknown error'));
      }
      const orderToSave = orderEntityResult.value;

      // 2. Act
      const saveResult = await orderRepository.save(orderToSave);

      // 3. Assert
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;
      const savedOrder = saveResult.value;

      // Check basic order details
      expect(savedOrder.id).toBe(orderId);
      expect(savedOrder.userId).toBe(testUser.id);
      expect(savedOrder.totalPrice).toBe(parseFloat(totalPrice.toFixed(2)));
      expect(savedOrder.shippingAddress).toEqual(shippingAddress);
      expect(savedOrder.status).toBe(OrderStatus.PENDING_PAYMENT);

      // Check order items
      expect(savedOrder.getOrderItemsArray().length).toBe(1);
      const savedItemEntity = savedOrder.getOrderItemsArray()[0];
      expect(savedItemEntity.productId).toBe(testProduct.id);
      expect(savedItemEntity.quantity).toBe(2);
      expect(savedItemEntity.price).toBe(testProduct.price);
      expect(savedItemEntity.name).toBe(testProduct.name);
      expect(savedItemEntity.toDto().productSnapshot?.id).toBe(testProduct.id);

      // Verify directly in DB
      const dbOrder = await db.query.order.findFirst({
        where: eq(schema.order.id, orderId),
        with: {
          orderItems: {
            with: {
              snapshot: true,
            },
          },
        },
      });

      expect(dbOrder).toBeDefined();
      expect(dbOrder?.user_id).toBe(testUser.id);
      expect(parseFloat(dbOrder!.total_price!)).toBe(totalPrice);

      expect(dbOrder?.orderItems).toHaveLength(1);
      const dbItem = dbOrder?.orderItems[0];
      expect(dbItem?.product_id).toBe(testProduct.id);
      expect(dbItem?.quantity).toBe(2);
      expect(parseFloat(dbItem!.price!)).toBe(testProduct.price);

      // Check the loaded snapshot from the relation
      expect(dbItem?.snapshot).toBeDefined();
      expect(dbItem?.snapshot?.product_id).toBe(testProduct.id);
      expect(dbItem?.snapshot?.name).toBe(testProduct.name);
      expect(parseFloat(dbItem!.snapshot!.price!)).toBe(testProduct.price);

      // Explicitly check the snapshot table as a secondary verification (optional but good)
      const dbSnapshotDirect = await db.query.orderProductSnapshot.findFirst({
        where: eq(schema.orderProductSnapshot.order_item_id, dbItem!.id),
      });

      expect(dbSnapshotDirect).toBeDefined();
      expect(dbSnapshotDirect?.product_id).toBe(testProduct.id);
      expect(dbSnapshotDirect?.name).toBe(testProduct.name);
      expect(parseFloat(dbSnapshotDirect!.price!)).toBe(testProduct.price);
    });

    it('should successfully update an existing order, including its items and properties', async () => {
      // 1. Arrange: Create initial order with 3 items
      const userForUpdate = await createDbUser({ email: `updateuser-${randomUUID()}@example.com`, name: 'Update User' });
      const product1 = await createDbProduct({ name: `Update Prod 1 ${randomUUID()}`, price: 10 });
      const product2 = await createDbProduct({ name: `Update Prod 2 ${randomUUID()}`, price: 20 });
      const product3 = await createDbProduct({ name: `Update Prod 3 ${randomUUID()}`, price: 30 });
      testUser = userForUpdate;

      const initialOrderId = randomUUID();
      const initialShippingAddress: ShippingAddress = {
        fullName: testUser.name!, streetAddress: '123 Update St', city: 'Updateville', postalCode: '54321', country: 'Updateland',
      };

      const createOrderItemDto = (product: ProductEntity, quantity: number, orderIdPlaceholder: string): OrderItemDto => ({
        id: randomUUID(), orderId: orderIdPlaceholder, productId: product.id, quantity, price: product.price,
        name: product.name, slug: product.slug, image: product.images[0],
        productDto: product.toDto(), productSnapshot: product.toDto(),
        createdAt: new Date(), updatedAt: new Date(),
      });

      const initialItem1Dto = createOrderItemDto(product1, 1, initialOrderId);
      const initialItem2Dto = createOrderItemDto(product2, 2, initialOrderId);
      const initialItem3Dto = createOrderItemDto(product3, 1, initialOrderId);

      const initialOrderDto: OrderDto = {
        id: initialOrderId, userId: testUser.id, shippingAddress: initialShippingAddress, paymentMethod: 'TestPayUpdate',
        itemsPrice: 10 + (20 * 2) + 30, shippingPrice: 5, taxPrice: 0, totalPrice: 10 + (20 * 2) + 30 + 5,
        status: OrderStatus.PENDING_PAYMENT, isPaid: false, paidAt: null, isDelivered: false, deliveredAt: null,
        paymentResult: null,
        trackingNumber: null, customerNotes: 'Initial customer notes', internalNotes: null,
        createdAt: new Date(Date.now() - 10000), updatedAt: new Date(Date.now() - 10000), orderItemDtos: [initialItem1Dto, initialItem2Dto, initialItem3Dto],
      };

      const initialOrderEntityResult = await OrderEntity.create(initialOrderDto);
      if (!initialOrderEntityResult.success) throw initialOrderEntityResult.error;
      const initialOrderEntity = initialOrderEntityResult.value;

      const saveResult1 = await orderRepository.save(initialOrderEntity);
      expect(saveResult1.success).toBe(true);
      if (!saveResult1.success) throw saveResult1.error;
      const timeAfterInitialSave = new Date();

      // 2. Act & Assert - Stage 1: Remove an OrderItem
      const loadedOrderResult1 = await orderRepository.findById(initialOrderId);
      expect(loadedOrderResult1.success).toBe(true);
      if (!loadedOrderResult1.success) throw loadedOrderResult1.error;
      let orderToModify1 = loadedOrderResult1.value;
      expect(orderToModify1.getOrderItemsArray()).toHaveLength(3);
      const initialUpdatedAt1 = orderToModify1.updatedAt;

      // Remove product2 (initialItem2Dto.productId which is product2.id)
      const removeItemResult = orderToModify1.removeOrderItem(product2.id);
      expect(removeItemResult.success).toBe(true);
      if (!removeItemResult.success) throw removeItemResult.error;
      orderToModify1 = removeItemResult.value;

      // The OrderEntity itself might not have its updatedAt changed yet, that happens on save.
      // We need to create a new DTO for saving, reflecting new updatedAt and items price.
      const baseDtoAfterItemRemoval = orderToModify1.toDto();
      const newItemsPrice = orderToModify1.calculateItemsPrice();
      const newTotalPrice = newItemsPrice + baseDtoAfterItemRemoval.shippingPrice + baseDtoAfterItemRemoval.taxPrice;

      const orderDtoForSaveAfterRemove: OrderDto = {
        ...baseDtoAfterItemRemoval,
        itemsPrice: newItemsPrice,
        totalPrice: newTotalPrice,
        updatedAt: new Date(),
      };
      const orderEntityForSaveAfterRemoveResult = OrderEntity.create(orderDtoForSaveAfterRemove);
      if (!orderEntityForSaveAfterRemoveResult.success) throw orderEntityForSaveAfterRemoveResult.error;

      const saveResult2 = await orderRepository.save(orderEntityForSaveAfterRemoveResult.value);
      expect(saveResult2.success).toBe(true);
      if (!saveResult2.success) throw saveResult2.error;
      const timeAfterItemRemovalSave = new Date();

      const loadedOrderResult2 = await orderRepository.findById(initialOrderId);
      expect(loadedOrderResult2.success).toBe(true);
      if (!loadedOrderResult2.success) throw loadedOrderResult2.error;
      const orderAfterItemRemoval = loadedOrderResult2.value;
      expect(orderAfterItemRemoval.getOrderItemsArray()).toHaveLength(2);
      expect(orderAfterItemRemoval.getOrderItemsArray().find(item => item.productId === product2.id)).toBeUndefined();
      expect(orderAfterItemRemoval.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt1.getTime());
      expect(orderAfterItemRemoval.updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterInitialSave.getTime());
      expect(orderAfterItemRemoval.updatedAt.getTime()).toBeLessThanOrEqual(timeAfterItemRemovalSave.getTime() + 1000);
      const expectedItemsPriceAfterRemoval = product1.price + product3.price;
      expect(parseFloat(orderAfterItemRemoval.itemsPrice.toString())).toBe(expectedItemsPriceAfterRemoval);

      // 3. Act & Assert - Stage 2: Update a root-level field (e.g., customerNotes)
      const newCustomerNotes = 'Updated customer notes after item removal.';
      const baseDtoForNoteUpdate = orderAfterItemRemoval.toDto();
      const orderDtoForNoteUpdate: OrderDto = {
        ...baseDtoForNoteUpdate,
        customerNotes: newCustomerNotes,
        updatedAt: new Date(),
      };
      const orderEntityForNoteUpdateResult = OrderEntity.create(orderDtoForNoteUpdate);
      if (!orderEntityForNoteUpdateResult.success) throw orderEntityForNoteUpdateResult.error;

      const saveResult3 = await orderRepository.save(orderEntityForNoteUpdateResult.value);
      expect(saveResult3.success).toBe(true);
      if (!saveResult3.success) throw saveResult3.error;
      const timeAfterNoteUpdateSave = new Date();

      const finalLoadedOrderResult = await orderRepository.findById(initialOrderId);
      expect(finalLoadedOrderResult.success).toBe(true);
      if (!finalLoadedOrderResult.success) throw finalLoadedOrderResult.error;
      const finalOrder = finalLoadedOrderResult.value;

      expect(finalOrder.getOrderItemsArray()).toHaveLength(2);
      expect(finalOrder.customerNotes).toBe(newCustomerNotes);
      expect(finalOrder.updatedAt.getTime()).toBeGreaterThanOrEqual(orderAfterItemRemoval.updatedAt.getTime());
      expect(finalOrder.updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterItemRemovalSave.getTime());
      expect(finalOrder.updatedAt.getTime()).toBeLessThanOrEqual(timeAfterNoteUpdateSave.getTime() + 1000);
    });
  });

  describe('findById', () => {
    it('should return the order with correct details including order items and snapshots if found', async () => {
      // 1. Arrange
      const userForFind = await createDbUser({email: `user-findbyid-${randomUUID()}@example.com`});
      const productForFind = await createDbProduct({name: `Product for findById ${randomUUID()}`});
      testUser = userForFind;
      testProduct = productForFind;

      const orderId = randomUUID();
      const shippingAddress: ShippingAddress = {
        fullName: 'Finder Customer',
        streetAddress: '456 Find St',
        city: 'Findsville',
        postalCode: '67890',
        country: 'Findland',
      };

      const orderItemDto: OrderItemDto = {
        id: randomUUID(),
        orderId: orderId,
        productId: testProduct.id,
        quantity: 1,
        price: testProduct.price,
        name: testProduct.name,
        slug: testProduct.slug,
        image: testProduct.images[0],
        productDto: testProduct.toDto(),
        productSnapshot: testProduct.toDto(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const itemsPrice = orderItemDto.quantity * orderItemDto.price;
      const shippingPrice = 10.00;
      const taxPrice = itemsPrice * 0.15;
      const totalPrice = itemsPrice + shippingPrice + taxPrice;

      const orderDto: OrderDto = {
        id: orderId,
        userId: testUser.id,
        shippingAddress: shippingAddress,
        paymentMethod: 'Credit Card',
        paymentResult: null,
        itemsPrice: itemsPrice,
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalPrice: totalPrice,
        status: OrderStatus.PENDING_PAYMENT,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        trackingNumber: null,
        customerNotes: null,
        internalNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderItemDtos: [orderItemDto],
      };

      const orderEntityResult = await OrderEntity.create(orderDto);
      if (!orderEntityResult.success) {
        expect(orderEntityResult.success).toBe(true);
        throw new Error('OrderEntity.create failed: ' + (orderEntityResult.error?.message || 'Unknown error'));
      }
      const orderToSave = orderEntityResult.value;

      await orderRepository.save(orderToSave);

      // 2. Act
      const foundOrderResult = await orderRepository.findById(orderId);

      // 3. Assert
      if (!foundOrderResult.success) {
        expect(foundOrderResult.success).toBe(true);
        throw new Error('orderRepository.findById failed: ' + (foundOrderResult.error?.message || 'Unknown error'));
      }
      const foundOrder = foundOrderResult.value;
      expect(foundOrder).toBeDefined();

      expect(foundOrder.id).toBe(orderId);
      expect(foundOrder.userId).toBe(testUser.id);
      expect(foundOrder.totalPrice).toBe(totalPrice);
      expect(foundOrder.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(foundOrder.shippingAddress.streetAddress).toBe('456 Find St');

      const foundOrderItems = foundOrder.getOrderItemsArray();
      expect(foundOrderItems).toHaveLength(1);
      const firstItem = foundOrderItems[0];

      expect(firstItem.productId).toBe(testProduct.id);
      expect(firstItem.quantity).toBe(1);
      expect(firstItem.price).toBe(testProduct.price);
      expect(firstItem.name).toBe(testProduct.name);

      const firstItemDto = firstItem.toDto();
      expect(firstItemDto.productSnapshot).toBeDefined();
      expect(firstItemDto.productSnapshot?.id).toBe(testProduct.id);
      expect(firstItemDto.productSnapshot?.name).toBe(testProduct.name);
      expect(firstItemDto.productSnapshot?.price).toBe(testProduct.price);
    });

    it('should return a failure result with an error if order is not found', async () => {
      // 1. Arrange
      const nonExistentOrderId = randomUUID();

      // 2. Act
      const foundOrderResult = await orderRepository.findById(nonExistentOrderId);

      // 3. Assert
      expect(foundOrderResult.success).toBe(false);

      if (foundOrderResult.success) {
        fail('Expected foundOrderResult.success to be false, but it was true.');
      } else {
        expect(foundOrderResult.error).toBeInstanceOf(Error);
        expect(foundOrderResult.error.message).toBe('Order not found');
      }
    });
  });

  describe('findByUserId', () => {
    it('should return all orders for a specific user with correct details', async () => {
      // 1. Arrange
      const userWithOrders = await createDbUser({ email: `userwithorders-${randomUUID()}@example.com`, name: 'User With Orders' });
      const otherUser = await createDbUser({ email: `otheruser-${randomUUID()}@example.com`, name: 'Other User' });
      const product1ForUserOrders = await createDbProduct({name: `Prod1 UserOrders ${randomUUID()}`});
      const product2ForUserOrders = await createDbProduct({name: `Prod2 UserOrders ${randomUUID()}`});

      const createAndSaveOrderForUser = async (user: UserEntity, product: ProductEntity) => {
        const orderId = randomUUID();
        const shippingAddress: ShippingAddress = { fullName: 'Test', streetAddress: '123', city: 'Test', postalCode: '123', country: 'Test' };
        const orderItemDto: OrderItemDto = {
          id: randomUUID(), orderId, productId: product.id, quantity: 1, price: product.price,
          name: product.name, slug: product.slug, image: product.images[0],
          productDto: product.toDto(), productSnapshot: product.toDto(),
          createdAt: new Date(), updatedAt: new Date(),
        };
        const orderDto: OrderDto = {
          id: orderId,
          userId: user.id,
          shippingAddress,
          paymentMethod: 'Test',
          paymentResult: null,
          itemsPrice: product.price,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: product.price,
          status: OrderStatus.DELIVERED,
          isPaid: true,
          paidAt: new Date(),
          isDelivered: true,
          deliveredAt: new Date(),
          trackingNumber: null,
          customerNotes: null,
          internalNotes: null,
          orderItemDtos: [orderItemDto],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const orderEntityResult = await OrderEntity.create(orderDto);
        if (!orderEntityResult.success) throw orderEntityResult.error;
        const saveRes = await orderRepository.save(orderEntityResult.value);
        if (!saveRes.success) throw saveRes.error;
        return saveRes.value;
      };

      const order1User1 = await createAndSaveOrderForUser(userWithOrders, product1ForUserOrders);
      const order2User1 = await createAndSaveOrderForUser(userWithOrders, product2ForUserOrders);
      await createAndSaveOrderForUser(otherUser, product1ForUserOrders);

      // 2. Act
      const result = await orderRepository.findByUserId(userWithOrders.id);

      // 3. Assert
      expect(result.success).toBe(true);
      if (!result.success) throw result.error;

      const orders = result.value;
      expect(orders).toHaveLength(2);

      const order1Found = orders.find(o => o.id === order1User1.id);
      const order2Found = orders.find(o => o.id === order2User1.id);
      expect(order1Found).toBeDefined();
      expect(order2Found).toBeDefined();

      expect(order1Found?.userId).toBe(userWithOrders.id);
      expect(order2Found?.userId).toBe(userWithOrders.id);

      expect(order1Found?.totalPrice).toBe(product1ForUserOrders.price);
      const order1Items = order1Found!.getOrderItemsArray();
      expect(order1Items).toHaveLength(1);
      expect(order1Items[0].productId).toBe(product1ForUserOrders.id);
      expect(order1Items[0].name).toBe(product1ForUserOrders.name);
      expect(order1Items[0].toDto().productSnapshot?.id).toBe(product1ForUserOrders.id);
    });

    it('should return an empty array if the user exists but has no orders', async () => {
      // 1. Arrange
      const userWithoutOrders = await createDbUser({ email: `user-noorders-${randomUUID()}@example.com`, name: 'User No Orders' });

      // 2. Act
      const result = await orderRepository.findByUserId(userWithoutOrders.id);

      // 3. Assert
      expect(result.success).toBe(true);
      if (!result.success) throw result.error;

      const orders = result.value;
      expect(orders).toBeInstanceOf(Array);
      expect(orders).toHaveLength(0);
    });
  });
});
