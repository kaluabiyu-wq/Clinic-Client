import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { poll } from './polling';

describe('poll', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polls on the interval and keeps going after an error', () => {
    let calls = 0;
    const results: boolean[] = [];

    const sub = poll(() => {
      calls++;
      return calls === 2 ? throwError(() => new Error('offline')) : of(calls);
    }, 10_000).subscribe((r) => results.push(r.ok));

    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(10_000);
    vi.advanceTimersByTime(10_000);

    expect(results).toEqual([true, false, true]);
    sub.unsubscribe();
  });
});
