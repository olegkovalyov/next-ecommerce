export type Result<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

export function failure<T>(error: Error): Result<T> {
  return { success: false, error };
} 