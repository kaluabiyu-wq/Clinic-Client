import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthUser } from '../models/auth.models';
import { AuthService } from './auth.service';

const KEY = 'clinic.session';
const user: AuthUser = { id: 'u1', fullName: 'Almaz Tadesse', email: 'a@clinic.local', role: 'Receptionist', doctorId: null };
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

describe('AuthService', () => {
  let http: HttpTestingController;

  function create(saved?: object): AuthService {
    localStorage.removeItem(KEY);
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  afterEach(() => localStorage.removeItem(KEY));

  it('starts signed out', () => {
    const auth = create();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('login stores the session and exposes the user and role', () => {
    const auth = create();
    auth.login('a@clinic.local', 'pw').subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'a@clinic.local', password: 'pw' });
    req.flush({ token: 'jwt', expiresAtUtc: inOneHour(), user });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.role()).toBe('Receptionist');
    expect(auth.token()).toBe('jwt');
    expect(JSON.parse(localStorage.getItem(KEY)!).token).toBe('jwt');
  });

  it('a wrong password leaves the user signed out', () => {
    const auth = create();
    let status = 0;
    auth.login('a@clinic.local', 'bad').subscribe({ error: (e) => (status = e.status) });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logout clears the session and goes to /login', () => {
    const auth = create({ token: 't', expiresAtUtc: inOneHour(), user });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('ignores an expired saved session', () => {
    const auth = create({ token: 't', expiresAtUtc: new Date(Date.now() - 1000).toISOString(), user });
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('hasRole matches any of the given roles', () => {
    const auth = create({ token: 't', expiresAtUtc: inOneHour(), user });
    expect(auth.hasRole('Receptionist', 'Administrator')).toBe(true);
    expect(auth.hasRole('Administrator')).toBe(false);
  });

  it('homeFor maps each role to its landing page', () => {
    const auth = create();
    expect(auth.homeFor('Receptionist')).toBe('/reception');
    expect(auth.homeFor('Clinician')).toBe('/consultation');
    expect(auth.homeFor('Administrator')).toBe('/reports');
    expect(auth.homeFor(null)).toBe('/login');
  });

  it('restore refreshes the user from /auth/me and keeps the session if the API is unreachable', async () => {
    const auth = create({ token: 't', expiresAtUtc: inOneHour(), user });

    const done = auth.restore();
    http.expectOne('/api/auth/me').flush({ ...user, role: 'Administrator' });
    await done;
    expect(auth.role()).toBe('Administrator');

    const offline = auth.restore();
    http.expectOne('/api/auth/me').error(new ProgressEvent('error'));
    await offline;
    expect(auth.isAuthenticated()).toBe(true);
  });
});
