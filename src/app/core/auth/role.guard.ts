import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StaffRole } from '../models/auth.models';
import { AuthService } from './auth.service';

/**
 * Route needs a signed-in user holding one of the given roles (see the route map in app.routes.ts):
 *   canActivate: [roleGuard('Receptionist', 'Administrator')]
 * Not signed in -> /login. Signed in with the wrong role -> that role's own home page.
 * (The API enforces the same roles; this only keeps staff out of screens they cannot use.)
 */
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
