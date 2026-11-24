import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslateService } from '../i18n/translate.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  async function render(session?: object) {
    localStorage.removeItem('clinic.session');
    if (session) localStorage.setItem('clinic.session', JSON.stringify(session));

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const http = TestBed.inject(HttpTestingController);
    const init = TestBed.inject(TranslateService).init();
    http.expectOne('/i18n/en.json').flush({
      app: { name: 'CarePoint' },
      nav: { book: 'Book appointment', reports: 'Reports', reception: 'Reception' },
      user: { staffSignIn: 'Staff sign in' },
    });
    await init;

    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  const session = (role: string) => ({
    token: 't',
    expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
    user: { id: '1', fullName: 'Test User', email: 'a@b.c', role, doctorId: null },
  });

  it('shows only public links and a sign-in prompt when signed out', async () => {
    const text = await render();
    expect(text).toContain('Book appointment');
    expect(text).toContain('Staff sign in');
    expect(text).not.toContain('Reception');
    expect(text).not.toContain('Reports');
  });

  it('shows management links for an administrator', async () => {
    const text = await render(session('Administrator'));
    expect(text).toContain('Reports');
    expect(text).toContain('Reception');
    expect(text).toContain('Test User');
  });

  it('hides management links from a receptionist', async () => {
    const text = await render(session('Receptionist'));
    expect(text).toContain('Reception');
    expect(text).not.toContain('Reports');
  });
});
