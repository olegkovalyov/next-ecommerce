import { Result, failure, success } from '@/lib/result';

export async function handleCartAction<TDto>(action: () => Promise<Result<any>>): Promise<Result<TDto>> {
  try {
    const result = await action();
    if (!result.success) return failure(result.error);
    if (typeof result.value?.toDto === 'function') {
      return success(result.value.toDto());
    }
    return success(result.value);
  } catch (e) {
    return failure(new Error('Cart action failed'));
  }
}
