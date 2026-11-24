import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Route needs a signed-in user (any role). Otherwise go to /login and come back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** For /login: someone already signed in is sent to their home page instead. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.parseUrl(auth.homeFor(auth.role())) : true;
};
