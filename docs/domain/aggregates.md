# Domain Aggregates

This document describes the aggregate roots in our domain model and their invariants.

## Cart Aggregate

The `Cart` is an aggregate root that manages a collection of `CartItem` entities. It ensures the consistency of the shopping cart state.

### Key Characteristics:
- **Aggregate Root**: `CartEntity`
- **Entities**: `CartItemEntity`
- **Invariants**:
  - A cart must have a unique ID
  - A cart must belong to a user (optional, can be anonymous)
  - Cart items must reference valid products
  - Cart items must have positive quantities
  - The total quantity of a product in the cart cannot exceed the product's stock

### Business Rules:
- Adding items to cart
- Removing items from cart
- Updating item quantities
- Clearing the cart
- Calculating cart totals

### Access Pattern:
All operations on cart items must go through the `Cart` aggregate root. Direct manipulation of cart items is not allowed.

## Order Aggregate

The `Order` is an aggregate root that manages a collection of `OrderItem` entities. It represents a completed purchase transaction.

### Key Characteristics:
- **Aggregate Root**: `OrderEntity`
- **Entities**: `OrderItemEntity`
- **Invariants**:
  - An order must have a unique ID
  - An order must belong to a user
  - An order must have a valid shipping address
  - An order must have a valid payment method
  - Order items must reference valid products
  - Order items must have positive quantities
  - The total price must be correctly calculated

### Business Rules:
- Creating new orders
- Adding items to orders
- Updating order status (paid, delivered)
- Calculating order totals (items, shipping, tax)

### Access Pattern:
All operations on order items must go through the `Order` aggregate root. Direct manipulation of order items is not allowed.

## Implementation Notes

Both aggregates are implemented using the Repository pattern:
- `CartRepository` for cart operations
- `OrderRepository` for order operations

The repositories ensure that:
1. Aggregates are loaded and saved as complete units
2. All invariants are maintained during operations
3. Changes are persisted atomically
4. Related entities are always loaded together with the aggregate root

## Best Practices

When working with these aggregates:
1. Always load the complete aggregate
2. Perform all modifications through the aggregate root
3. Save the entire aggregate at once
4. Use the provided service layer (`CartService`, `OrderService`) for business operations
5. Never manipulate child entities directly 