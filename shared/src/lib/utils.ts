export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; delay: number; backoff: 'linear' | 'exponential' },
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= opts.attempts) {
        throw err;
      }
      const sleepTime =
        opts.backoff === 'exponential' ? opts.delay * Math.pow(2, attempt - 1) : opts.delay;
      await sleep(sleepTime);
    }
  }
}
