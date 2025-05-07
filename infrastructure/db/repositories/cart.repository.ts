import { CartEntity } from '@/domain/entities/cart.entity';
import { CartDto, CartItemDto, ProductDto } from '@/domain/dtos';
import { Result, success, failure } from '@/lib/result';
import { DrizzleClient } from '@/infrastructure/db';
import * as schema from '../schema';
import { eq, and } from 'drizzle-orm';
import { CartRepositoryInterface } from '@/domain/repositories/cart-repository.interface';
import { sql } from 'drizzle-orm';

export class DrizzleCartRepository implements CartRepositoryInterface {
  constructor(private readonly db: DrizzleClient) {
  }

  async findById(id: string): Promise<Result<CartEntity>> {
    try {
      // Fetch cart
      const carts = await this.db.select().from(schema.cart).where(eq(schema.cart.id, id)).limit(1);

      if (!carts.length) {
        return failure(new Error('Cart not found'));
      }

      // Fetch cart items with product details
      const cartItems = await this.db.select()
        .from(schema.cartItem)
        .where(eq(schema.cartItem.cart_id, id));

      // Fetch products for the cart items
      const cartItemDtos: CartItemDto[] = [];

      for (const cartItem of cartItems) {
        if (cartItem.product_id) {
          const products = await this.db.select()
            .from(schema.product)
            .where(sql`${schema.product.id} = ${cartItem.product_id}`)
            .limit(1);

          if (products.length) {
            const product = products[0];

            // Create ProductDto with correct fields
            const productDto: ProductDto = {
              id: product.id,
              name: product.name,
              slug: product.slug,
              category: product.category,
              brand: product.brand,
              description: product.description,
              stock: product.stock,
              images: product.images,
              isFeatured: product.is_featured,
              banner: product.banner,
              price: Number(product.price),
              rating: Number(product.rating),
              numReviews: product.num_reviews,
              createdAt: product.created_at ?? new Date(),
            };

            cartItemDtos.push(new CartItemDto(
              cartItem.id,
              cartItem.cart_id,
              cartItem.product_id,
              cartItem.quantity,
              productDto
            ));
          }
        }
      }

      // Create cart DTO
      const cartDto: CartDto = {
        id: carts[0].id,
        userId: carts[0].user_id ?? null,
        taxPercentage: carts[0].tax_percentage, // Retrieve taxPercentage
        cartItemDtos: cartItemDtos,
      };

      return CartEntity.fromDto(cartDto);
    } catch (error) {
      console.error('Failed to find cart by ID:', error);
      return failure(error instanceof Error ? error : new Error('Failed to find cart'));
    }
  }

  async findByUserId(userId: string): Promise<Result<CartEntity>> {
    try {
      // First check if user exists in database before trying to create a cart
      if (userId) {
        const users = await this.db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);

        // If user doesn't exist, don't try to create a cart linked to that user
        if (users.length === 0) {
          // Create a guest cart without user_id
          const guestCartId = crypto.randomUUID();

          // Create empty cart DTO for guest
          const guestCartDto: CartDto = {
            id: guestCartId,
            userId: null,
            taxPercentage: 0,
            cartItemDtos: [],
          };

          return CartEntity.fromDto(guestCartDto);
        }

        // User exists, proceed with finding or creating their cart
        const carts = await this.db.select().from(schema.cart).where(eq(schema.cart.user_id, userId)).limit(1);

        if (!carts.length) {
          // Create a new cart for the user
          const newCart = {
            id: crypto.randomUUID(),
            user_id: userId,
            tax_percentage: 0, // Default for new cart, will be overridden by save if cart has specific tax
          };

          await this.db.insert(schema.cart).values(newCart);

          // Return an empty cart
          const emptyCartDto: CartDto = {
            id: newCart.id,
            userId: newCart.user_id,
            taxPercentage: newCart.tax_percentage,
            cartItemDtos: [],
          };

          return CartEntity.fromDto(emptyCartDto);
        }

        // Use the findById method to get the cart with its items
        return await this.findById(carts[0].id);
      } else {
        // No userId provided, create a guest cart
        const guestCartId = crypto.randomUUID();

        // Create empty cart DTO for guest
        const guestCartDto: CartDto = {
          id: guestCartId,
          userId: null,
          taxPercentage: 0,
          cartItemDtos: [],
        };

        return CartEntity.fromDto(guestCartDto);
      }
    } catch (error) {
      console.error('Failed to find cart by user ID:', error);
      return failure(error instanceof Error ? error : new Error('Failed to find cart by user ID'));
    }
  }

  async save(cart: CartEntity): Promise<Result<CartEntity>> {
    return await this.db.transaction(async (tx) => {
      try {
        const cartDto = cart.toDto();

        // Check if cart exists using the transaction client
        const cartExistsInDb = await tx.select().from(schema.cart).where(eq(schema.cart.id, cartDto.id)).limit(1);

        if (cartExistsInDb.length === 0) {
          // Create a new cart
          if (!cartDto.userId) {
            // For guest carts, if we are not storing them, this logic might need review.
            // For now, assuming guest carts are not persisted and just returned.
            // However, tests seem to imply user carts are being created.
            // This early return for guest carts might be problematic if items need to be processed.
            // For a transactional save, we should probably always attempt to persist if called.
            // Re-evaluating guest cart logic: if save is called, it should try to save.
          }

          // Check if user exists before linking cart to user (if userId is present)
          if (cartDto.userId) {
            const users = await tx.select().from(schema.user).where(eq(schema.user.id, cartDto.userId)).limit(1);
            if (users.length === 0) {
              console.error(`User with ID ${cartDto.userId} not found within transaction. Cannot save cart.`);
              return failure(new Error(`User with ID ${cartDto.userId} not found within transaction. Cannot save cart.`));
            }
          }

          await tx.insert(schema.cart).values({
            id: cartDto.id,
            user_id: cartDto.userId || null,
            tax_percentage: cartDto.taxPercentage,
          });
        } else {
          // Update existing cart (if necessary, e.g., taxPercentage changes)
          const existingDbCartData = cartExistsInDb[0];
          if (existingDbCartData.tax_percentage !== cartDto.taxPercentage || !cartDto.userId && existingDbCartData.user_id) {
            await tx.update(schema.cart)
              .set({
                tax_percentage: cartDto.taxPercentage,
                user_id: cartDto.userId || null, // Allow updating/clearing userId
                updated_at: new Date()
              })
              .where(eq(schema.cart.id, cartDto.id));
          }
        }

        // Logic for cart items - applies to both new and existing user carts
        // Guest cart items are not persisted according to original logic, reconsider if this is correct.
        // If userId is null, perhaps we should skip item persistence.
        // However, if save() is called, it implies an intent to persist. Removing the userId check for item persistence.

        const currentCartItems = await tx.select()
          .from(schema.cartItem)
          .where(eq(schema.cartItem.cart_id, cartDto.id));

        const itemDtos = cartDto.cartItemDtos || [];
        const dtoItemIds = itemDtos.map(item => item.id);

        // Items to delete: in currentCartItems but not in itemDtos
        const itemsToDelete = currentCartItems.filter(ci => !dtoItemIds.includes(ci.id));
        if (itemsToDelete.length > 0) {
          await tx.delete(schema.cartItem)
            .where(sql.raw(`id IN (${itemsToDelete.map(itd => `'${itd.id}'`).join(',')})`));
        }

        // Items to update or insert
        for (const itemDto of itemDtos) {
          const existingItem = currentCartItems.find(ci => ci.id === itemDto.id);
          if (existingItem) {
            // Update if quantity or price changed
            // Note: Drizzle's decimal type for price might require string comparison or careful handling.
            // Assuming itemDto.productDto.price is the authoritative price.
            if (existingItem.quantity !== itemDto.quantity ||
                (itemDto.productDto.price !== undefined && existingItem.price !== itemDto.productDto.price.toString())) {
              await tx.update(schema.cartItem)
                .set({
                  quantity: itemDto.quantity,
                  price: itemDto.productDto.price.toString(), // Store the price as string
                  updated_at: new Date(),
                })
                .where(and(eq(schema.cartItem.id, itemDto.id), eq(schema.cartItem.cart_id, cartDto.id)));
            }
          } else {
            // Insert new cart item
            await tx.insert(schema.cartItem).values({
              id: itemDto.id,
              cart_id: cartDto.id,
              product_id: itemDto.productId,
              quantity: itemDto.quantity,
              price: itemDto.productDto.price.toString(), // Store the price as string
            });
          }
        }

        // Return the updated/created cart by fetching it again using the transaction
        // This part is complex because findById is not designed for transactions directly.
        // For simplicity, we'll return the input entity, assuming the operations were successful.
        // A more robust solution would be to re-fetch using tx and reconstruct the entity.
        // Or, adapt findById to accept an optional transaction client.
        // For now, let's just return the original entity which mirrors the structure post-save.
        // This relies on the DTOs within 'cart' entity being up-to-date.
        // A better approach for testing would be to call a 'tx.findByIdEquivalent(...)' here.

        // Re-fetch logic (simplified for now, findById uses this.db internally)
        // const finalCartResult = await this.findById(cartDto.id); // This would be outside tx or needs tx passthrough
        // if (!finalCartResult.success) throw new Error('Failed to re-fetch cart after save operation');
        // return success(finalCartResult.value);

        // Return the original entity passed in, assuming its state reflects the save.
        // The actual DTOs for items etc. are in cartDto which was derived from 'cart'.
        return success(cart);

      } catch (error) {
        console.error('Failed to save cart:', error);
        // Ensure the failure returns an actual Error instance
        return failure(error instanceof Error ? error : new Error('Failed to save cart transactionally'));
      }
    });
  }

  async delete(id: string): Promise<Result<CartEntity>> {
    try {
      // First check if cart exists
      const cartResult = await this.findById(id);

      if (!cartResult.success) {
        return failure(new Error('Cart not found'));
      }

      // Delete the cart (cascade will delete cart items)
      await this.db.delete(schema.cart).where(eq(schema.cart.id, id));

      // Return the deleted cart
      return success(cartResult.value);
    } catch (error) {
      console.error('Failed to delete cart:', error);
      return failure(error instanceof Error ? error : new Error('Failed to delete cart'));
    }
  }
}
