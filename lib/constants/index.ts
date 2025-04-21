export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION;
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
export const LATEST_PRODUCTS_LIMIT = 4;


export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ')
  : ['PayPal', 'Stripe', 'CashOnDelivery'];
export const DEFAULT_PAYMENT_METHOD = 'PayPal';
