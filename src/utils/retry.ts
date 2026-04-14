/**
 * Generic retry wrapper with exponential back-off.
 *
 * @param fn        The async function to attempt.
 * @param retries   Maximum number of retries (default 3).
 * @param delayMs   Initial delay in ms before first retry (default 1000).
 * @returns         The resolved value from `fn`.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Retry] Attempt ${attempt}/${retries} failed: ${lastError.message}`
      );

      if (attempt < retries) {
        const jitter = Math.random() * 500;
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * attempt + jitter)
        );
      }
    }
  }

  throw lastError ?? new Error("All retry attempts exhausted");
}
