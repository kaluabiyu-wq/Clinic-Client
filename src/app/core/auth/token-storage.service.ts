import { Injectable } from '@angular/core';
import { Session } from '../models/auth.models';

const STORAGE_KEY = 'clinic.session';

/**
 * Keeps the session (JWT + user) in localStorage so a page refresh does not sign staff out.
 * Storage can be unavailable (private mode, blocked cookies), so every call is guarded and
 * the session falls back to memory for the life of the page.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private memory: Session | null = null;

  load(): Session | null {
    const session = this.readStored() ?? this.memory;
    if (!session || !this.isUsable(session)) {
      this.clear();
      return null;
    }
    return session;
  }

  save(session: Session): void {
    this.memory = session;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage unavailable: the in-memory copy still works until the page is closed
    }
  }

  clear(): void {
    this.memory = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private readStored(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  /** Well-formed and not past its expiry time. */
  private isUsable(session: Session): boolean {
    return (
      typeof session?.token === 'string' &&
      session.token.length > 0 &&
      !!session.user?.role &&
      Date.parse(session.expiresAtUtc) > Date.now()
    );
  }
}
