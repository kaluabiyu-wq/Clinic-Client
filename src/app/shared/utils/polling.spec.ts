import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { poll } from './polling';

describe('poll', () => {
  it('polls on the interval and keeps going after an error', fakeAsync(() => {
    let calls = 0;
    const results: boolean[] = [];

    const sub = poll(() => {
      calls++;
      return calls === 2 ? throwError(() => new Error('offline')) : of(calls);
    }, 10_000).subscribe((r) => results.push(r.ok));

    tick(0);
    tick(10_000);
    tick(10_000);

    expect(results).toEqual([true, false, true]);
    sub.unsubscribe();
  }));
});
