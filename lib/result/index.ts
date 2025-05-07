export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

export function failure<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

export function hasError<T, E>(result: Result<T, E>): boolean {
  return !result.success;
}

export function value<T, E extends Error>(result: Result<T, E>): T {
  if (!result.success) {
    // Using type narrowing and a more generic message
    throw new Error(`Result is an error`);
  }
  return result.value;
}
