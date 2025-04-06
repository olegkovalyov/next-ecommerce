import { prisma } from '@/infrastructure/prisma/prisma';
import { failure, Result } from '@/lib/result';
import { CartItemRepository } from '@/infrastructure/repositories/cart-item.repository';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartItemDto } from '@/domain/dtos';

export class CartItemService {
  private readonly cartItemRepository: CartItemRepository;

  constructor() {
    this.cartItemRepository = new CartItemRepository(prisma);
  }

  async createCartItem(cartItemDto: CartItemDto): Promise<Result<CartItemEntity>> {
    return CartItemEntity.fromDto(cartItemDto);
  }

  async loadCartItemById(cartItemId: string): Promise<Result<CartItemEntity>> {
    const cartItem = await this.cartItemRepository.findById(cartItemId);
    return cartItem.success
      ? cartItem
      : failure(new Error('Cart item doesnt exist'));
  }
}
