export async function trace<T>(
  name: string,
  tags: string[],
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    if (process.env.LANGSMITH_API_KEY) {
      console.log(`[Trace] ${name} succeeded in ${Date.now() - start}ms. Tags: ${tags.join(', ')}`);
    }
    return result;
  } catch (error) {
    if (process.env.LANGSMITH_API_KEY) {
      console.error(`[Trace Error] ${name} failed in ${Date.now() - start}ms:`, error);
    }
    throw error;
  }
}

export function withTracing<Args extends any[], Ret>(
  name: string,
  tags: string[],
  fn: (...args: Args) => Promise<Ret>,
): (...args: Args) => Promise<Ret> {
  return async (...args: Args): Promise<Ret> => {
    return trace(name, tags, () => fn(...args));
  };
}
