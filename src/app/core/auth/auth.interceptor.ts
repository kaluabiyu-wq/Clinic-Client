import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * - Adds "Authorization: Bearer <jwt>" to calls to our API (not to other sites, not to the login call).
 * - If the API answers 401 to a call that carried a token, the session is no longer valid:
 *   sign out and go to /login, remembering where the user was.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isLogin = req.url.endsWith('/auth/login');
  if (!isApiCall || isLogin) return next(req);

  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token) {
        const returnUrl = router.url;
        auth.logout(false);
        void router.navigate(['/login'], {
          queryParams: returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {},
        });
      }
      return throwError(() => err);
    }),
  );
};
