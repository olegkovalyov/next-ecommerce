import { loadStripe } from '@stripe/stripe-js';

// Загружаем Stripe только один раз для лучшей производительности
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    // Здесь должен быть ваш публичный ключ Stripe из переменных окружения
    // В реальном приложении используйте process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
  }
  return stripePromise;
};
