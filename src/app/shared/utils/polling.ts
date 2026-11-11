import { Observable, catchError, exhaustMap, filter, map, of, timer } from 'rxjs';

export type PollResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Calls `request` immediately and then every `intervalMs` (default 10 s, the PDF's refresh target).
 * - A failed request emits { ok: false } and polling keeps going, so the UI can keep the last data.
 * - Ticks are skipped while the browser tab is hidden (saves data on low-end phones).
 * - exhaustMap: a slow request is never overlapped by the next tick.
 * Unsubscribe (or use takeUntilDestroyed) to stop.
 */
export function poll<T>(
  request: () => Observable<T>,
  intervalMs = 10_000,
): Observable<PollResult<T>> {
  return timer(0, intervalMs).pipe(
    filter(() => !document.hidden),
    exhaustMap(() =>
      request().pipe(
        map((value): PollResult<T> => ({ ok: true, value })),
        catchError((error): Observable<PollResult<T>> => of({ ok: false, error })),
      ),
    ),
  );
}
