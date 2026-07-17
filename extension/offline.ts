export interface QueueItem {
  id: string;
  payload: any;
  attempts: number;
  lastAttempt: number;
  createdAt: number;
}

const STORAGE_KEY = 'memora_offline_queue';

export async function getQueue(): Promise<QueueItem[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

export async function addToQueue(payload: any): Promise<void> {
  const queue = await getQueue();
  const newItem: QueueItem = {
    id: crypto.randomUUID(),
    payload,
    attempts: 0,
    lastAttempt: Date.now(),
    createdAt: Date.now(),
  };
  queue.push(newItem);
  await chrome.storage.local.set({ [STORAGE_KEY]: queue });
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}

export async function processQueue(
  apiRequest: (payload: any) => Promise<boolean>,
): Promise<{ succeeded: number; failed: number; remaining: number }> {
  const queue = await getQueue();
  let succeeded = 0;
  let failed = 0;

  const keptItems: QueueItem[] = [];

  for (const item of queue) {
    // 3 max attempts limit
    if (item.attempts >= 3) {
      console.warn(`[Offline Queue] Discarding item ${item.id} after 3 failed attempts.`);
      continue;
    }

    item.attempts++;
    item.lastAttempt = Date.now();

    try {
      const ok = await apiRequest(item.payload);
      if (ok) {
        succeeded++;
      } else {
        failed++;
        keptItems.push(item);
      }
    } catch (err) {
      failed++;
      keptItems.push(item);
    }
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: keptItems });

  return {
    succeeded,
    failed,
    remaining: keptItems.length,
  };
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export async function clearQueue(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
