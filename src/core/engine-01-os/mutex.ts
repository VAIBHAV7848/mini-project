export class KeyedMutex {
  private locks: Map<string, Promise<void>> = new Map();

  async acquire(key: string, timeoutMs = 5000): Promise<() => void> {
    const existingLock = this.locks.get(key) || Promise.resolve();

    let releaseLock: () => void = () => {};
    const currentLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Chain the lock
    const acquired = existingLock.then(() => currentLock);
    this.locks.set(key, acquired);

    // Timeout guard to prevent permanent starvation or deadlocks
    let timerId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`KeyedMutex timeout on key: ${key}`));
      }, timeoutMs);
    });

    try {
      await Promise.race([existingLock, timeoutPromise]);
    } catch (err) {
      releaseLock();
      if (this.locks.get(key) === acquired) {
        this.locks.delete(key);
      }
      throw err;
    } finally {
      if (timerId) clearTimeout(timerId);
    }

    let released = false;
    return () => {
      if (!released) {
        released = true;
        releaseLock();
        if (this.locks.get(key) === acquired) {
          this.locks.delete(key);
        }
      }
    };
  }

  async runExclusive<T>(key: string, fn: () => Promise<T>, timeoutMs = 15000): Promise<T> {
    const release = await this.acquire(key, timeoutMs);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const globalKeyedMutex = new KeyedMutex();
