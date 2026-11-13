import { Observable, catchError, exhaustMap, filter, map, of, timer } from 'rxjs';

export type PollResult<T> = { ok: true; value: T } | { ok: false; error: unknown };


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
