import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StaffRole } from '../models/users.model';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  doctorId: string | null;
}

interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

interface Session {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

const STORAGE_KEY = 'clinic.session';

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return Date.parse(session.expiresAtUtc) > Date.now() ? session : null;
  } catch {
    return null;
  }
}

/** Holds the signed-in staff member and their JWT (kept in localStorage so a refresh keeps you signed in). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed(() => this.user()?.role ?? null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.store(res)));
  }

  logout(redirect = true): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    if (redirect) void this.router.navigate(['/login']);
  }

  hasRole(...roles: StaffRole[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  /** Home page for the signed-in role. */
  homeFor(role: StaffRole | null): string {
    switch (role) {
      case 'Clinician':
        return '/consultation';
      case 'Administrator':
        return '/reports';
      case 'Receptionist':
        return '/reception';
      default:
        return '/login';
    }
  }

  private store(res: LoginResponse): void {
    const session: Session = { token: res.token, expiresAtUtc: res.expiresAtUtc, user: res.user };
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage unavailable: session lasts until the tab is closed
    }
  }
}
