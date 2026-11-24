import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';
import { roleGuard } from './role.guard';

const KEY = 'clinic.session';
const state = { url: '/reports' } as RouterStateSnapshot;
const route = {} as ActivatedRouteSnapshot;

function setup(role?: string) {
  localStorage.removeItem(KEY);
  if (role) {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        token: 't',
        expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
        user: { id: '1', fullName: 'X', email: 'x@y.z', role, doctorId: null },
      }),
    );
  }
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  return TestBed.inject(Router);
}

const run = (guard: ReturnType<typeof roleGuard>) =>
  TestBed.runInInjectionContext(() => guard(route, state));

describe('route guards', () => {
  afterEach(() => localStorage.removeItem(KEY));

  it('roleGuard sends signed-out visitors to /login with a return URL', () => {
    const router = setup();
    const result = run(roleGuard('Administrator')) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Freports');
  });

  it('roleGuard lets a matching role through', () => {
    setup('Administrator');
    expect(run(roleGuard('Administrator'))).toBe(true);
  });

  it('roleGuard sends a wrong role to its own home page', () => {
    const router = setup('Receptionist');
    const result = run(roleGuard('Administrator')) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/reception');
  });

  it('authGuard only needs a signed-in user', () => {
    setup('Clinician');
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('guestGuard bounces signed-in users away from /login', () => {
    const router = setup('Clinician');
    const result = TestBed.runInInjectionContext(() => guestGuard(route, state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/consultation');
  });
});
