export interface CookieCart {
  id: string;
  cartItems: Array<{
    id: string;
    productId: string;
    quantity: number;
  }>;
}
