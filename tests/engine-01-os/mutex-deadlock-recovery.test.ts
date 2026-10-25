import { describe, it, expect } from 'vitest';
import { KeyedMutex } from '@/core/engine-01-os/mutex';

describe('Engine 01 (OS) — KeyedMutex Deadlock Recovery & Timeout Resilience', () => {
  it('should recover gracefully from a lock acquisition timeout without deadlocking subsequent callers on the same key', async () => {
    const mutex = new KeyedMutex();
    const key = 'milestone-deadlock-recovery-key';

    // 1. Task A acquires the lock and holds it for 300ms
    const releaseA = await mutex.acquire(key, 500);

    // 2. Task B tries to acquire with a very short timeout (50ms) and times out
    let taskBTimedOut = false;
    try {
      await mutex.acquire(key, 50);
    } catch (err: any) {
      taskBTimedOut = true;
      expect(err.message).toContain('KeyedMutex timeout on key');
    }
    expect(taskBTimedOut).toBe(true);

    // 3. Task A finishes and releases
    releaseA();

    // 4. Task C tries to acquire the key.
    // In buggy implementations, Task B's timeout left an unresolved promise in this.locks,
    // causing Task C to freeze or time out. With our fix, Task C acquires immediately!
    let taskCAcquired = false;
    const releaseC = await mutex.acquire(key, 500);
    taskCAcquired = true;
    expect(taskCAcquired).toBe(true);
    releaseC();
  });
});
