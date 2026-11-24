import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, Session, StaffRole } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

/**
 * Who is signed in. State is held in signals so templates and guards react to sign-in / sign-out.
 * The JWT itself is attached to requests by auth.interceptor.ts.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);

  private readonly session = signal<Session | null>(this.storage.load());
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly user = computed<AuthUser | null>(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<StaffRole | null>(() => this.user()?.role ?? null);

  constructor() {
    this.scheduleExpiry();
  }

  /** POST /auth/login. A wrong password comes back as a 401 error for the caller to show. */
  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, body)
      .pipe(tap((res) => this.start({ token: res.token, expiresAtUtc: res.expiresAtUtc, user: res.user })));
  }

  logout(redirect = true): void {
    this.storage.clear();
    this.session.set(null);
    this.clearExpiryTimer();
    if (redirect) void this.router.navigate(['/login']);
  }

  /**
   * At start-up, ask the API who this token belongs to (GET /auth/me). This drops sessions for
   * accounts that were disabled or changed role since the last visit. If the API cannot be reached
   * the saved session is kept, so a brief outage does not sign everyone out.
   */
  async restore(): Promise<void> {
    const current = this.session();
    if (!current) return;

    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`).pipe(timeout(5000)),
      );
      this.start({ ...current, user });
    } catch {
      // 401 is handled by the interceptor (it signs out); any other error keeps the saved session.
    }
  }

  hasRole(...roles: StaffRole[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  /** The page each role lands on after signing in. */
  homeFor(role: StaffRole | null): string {
    switch (role) {
      case 'Receptionist':
        return '/reception';
      case 'Clinician':
        return '/consultation';
      case 'Administrator':
        return '/reports';
      default:
        return '/login';
    }
  }

  private start(session: Session): void {
    this.storage.save(session);
    this.session.set(session);
    this.scheduleExpiry();
  }

  /** Sign out automatically when the token runs out, instead of waiting for the next failed call. */
  private scheduleExpiry(): void {
    this.clearExpiryTimer();
    const session = this.session();
    if (!session) return;

    // setTimeout cannot hold delays above ~24.8 days
    const ms = Math.min(Date.parse(session.expiresAtUtc) - Date.now(), 2_147_000_000);
    this.expiryTimer = setTimeout(() => this.logout(), Math.max(ms, 0));
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}
