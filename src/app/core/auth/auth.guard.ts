import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StaffRole } from '../models/users.model';
import { AuthService } from './auth.service';

/** Requires sign-in, and (optionally) one of the given roles. */
export function roleGuard(...roles: StaffRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (roles.length > 0 && !auth.hasRole(...roles)) {
      return router.parseUrl(auth.homeFor(auth.role()));
    }
    return true;
  };
}
