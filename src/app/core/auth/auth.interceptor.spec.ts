import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const KEY = 'clinic.session';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  function setup(signedIn: boolean) {
    localStorage.removeItem(KEY);
    if (signedIn) {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          token: 'jwt-123',
          expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
          user: { id: '1', fullName: 'X', email: 'x@y.z', role: 'Receptionist', doctorId: null },
        }),
      );
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  }

  afterEach(() => localStorage.removeItem(KEY));

  it('adds the bearer token to API calls', () => {
    setup(true);
    http.get('/api/doctors').subscribe();
    expect(ctrl.expectOne('/api/doctors').request.headers.get('Authorization')).toBe('Bearer jwt-123');
  });

  it('does not add a token to the login call or to other sites', () => {
    setup(true);
    http.post('/api/auth/login', {}).subscribe();
    http.get('https://example.com/x').subscribe();
    expect(ctrl.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
    expect(ctrl.expectOne('https://example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('signs out and goes to /login when the API answers 401', () => {
    setup(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get('/api/appointments').subscribe({ error: () => undefined });
    ctrl.expectOne('/api/appointments').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalled();
    expect((navigate.mock.calls[0][0] as string[])[0]).toBe('/login');
  });

  it('leaves a 401 alone when nobody was signed in', () => {
    setup(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get('/api/doctors').subscribe({ error: () => undefined });
    ctrl.expectOne('/api/doctors').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
