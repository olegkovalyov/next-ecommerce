import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/infrastructure/auth/auth';
import { db } from '@/infrastructure/db';
import * as schema from '@/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-04-30.basil', // Use the latest API version
});

// Type definitions for cart items
type CartItem = {
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string | { toString(): string }; // Support for Decimal and other price formats
    images: string[];
  };
};

// Create line items for Stripe checkout
const createLineItems = (items: CartItem[]) => {
  return items.map((item) => {
    // Convert price to string first to handle various formats (including Decimal)
    const priceString = typeof item.product.price === 'object' && item.product.price !== null
      ? item.product.price.toString()
      : String(item.product.price);
    
    // Then convert to number and round to avoid floating point issues
    const priceInCents = Math.round(parseFloat(priceString) * 100);
    
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: item.product.images && item.product.images.length > 0 
            ? [item.product.images[0]] 
            : undefined,
        },
        unit_amount: priceInCents, // Stripe requires price in cents
      },
      quantity: item.quantity,
    };
  });
};

// Create a Stripe checkout session
const createStripeSession = async (
  lineItems: any[], 
  cartId: string, 
  userId: string,
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
) => {
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout`,
    metadata: {
      cartId,
      userId,
    },
  });

  return NextResponse.json({ sessionId: stripeSession.id, url: stripeSession.url });
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check authorization
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { cartId, cartItems, totalAmount } = body;

    // If we have cart items directly in the request (from client-side state)
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Use cart items from the request
      const lineItems = createLineItems(cartItems);
      return createStripeSession(
        lineItems, 
        'client-side-cart', 
        session.user.id,
        process.env.NEXT_PUBLIC_APP_URL
      );
    }
    
    // If we have a valid cart ID, try to get it from the database
    if (cartId && cartId !== 'temp-cart-id' && cartId !== 'client-side-cart') {
      try {
        // Find the cart in the database
        const cart = await db.select().from(schema.cart).where(eq(schema.cart.id, cartId)).limit(1);
        
        if (cart.length > 0) {
          const cartItems = await db.select()
            .from(schema.cartItem)
            .where(eq(schema.cartItem.cart_id, cartId));
          
          if (cartItems.length > 0) {
            // Fetch products for each cart item
            const items: CartItem[] = [];
            
            for (const item of cartItems) {
              if (item.product_id) {
                const products = await db.select()
                  .from(schema.product)
                  .where(eq(schema.product.id, item.product_id))
                  .limit(1);
                
                if (products.length > 0) {
                  items.push({
                    quantity: item.quantity,
                    product: {
                      id: products[0].id,
                      name: products[0].name,
                      price: products[0].price,
                      images: products[0].images,
                    }
                  });
                }
              }
            }
            
            if (items.length > 0) {
              const lineItems = createLineItems(items);
              return createStripeSession(
                lineItems, 
                cart[0].id, 
                session.user.id,
                process.env.NEXT_PUBLIC_APP_URL
              );
            }
          }
        }
      } catch (error) {
        console.error('Error finding cart:', error);
        // Continue with fallback if there's an error
      }
    }

    // If we reach here, we couldn't process the cart
    return NextResponse.json(
      { error: 'No valid cart items found' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
