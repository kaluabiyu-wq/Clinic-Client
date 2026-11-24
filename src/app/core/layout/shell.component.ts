import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { LangCode, TranslateService } from '../i18n/translate.service';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
  visible: boolean;
  exact?: boolean;
}

/**
 * Application frame: sidebar, top bar, page outlet and footer.
 * Every feature page except login and the 404 page renders inside the outlet.
 * The links shown depend on the signed-in role (see the route map in app.routes.ts).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(TranslateService);
  private readonly router = inject(Router);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly mobileMenuOpen = signal(false);

  private readonly canReception = computed(() => this.auth.hasRole('Receptionist', 'Administrator'));
  private readonly canConsult = computed(() => this.auth.hasRole('Clinician', 'Administrator'));
  protected readonly isAdmin = computed(() => this.auth.hasRole('Administrator'));

  protected readonly workspaceLinks = computed<NavItem[]>(() => [
    { path: '/reception', icon: '▦', labelKey: 'nav.reception', visible: this.canReception(), exact: true },
    { path: '/book', icon: '＋', labelKey: 'nav.book', visible: true },
    { path: '/track', icon: '◷', labelKey: 'nav.track', visible: true },
    { path: '/board', icon: '☷', labelKey: 'nav.board', visible: true },
    { path: '/consultation', icon: '♡', labelKey: 'nav.consultation', visible: this.canConsult() },
  ].filter((item) => item.visible));

  protected readonly managementLinks = computed<NavItem[]>(() => [
    { path: '/schedules', icon: '▣', labelKey: 'nav.schedules', visible: this.isAdmin() },
    { path: '/reports', icon: '▤', labelKey: 'nav.reports', visible: this.isAdmin() },
    { path: '/users', icon: '♙', labelKey: 'nav.users', visible: this.isAdmin() },
  ].filter((item) => item.visible));

  /** Where the logo points: the signed-in role's home, or the public booking page. */
  protected readonly homeLink = computed(() =>
    this.auth.isAuthenticated() ? this.auth.homeFor(this.auth.role()) : '/book',
  );

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.fullName ?? '';
    const parts = name.replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  constructor() {
    // Close the mobile drawer after every navigation.
    toSignal(
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.closeMobileMenu()),
      ),
    );
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected onLanguageChange(event: Event): void {
    void this.i18n.use((event.target as HTMLSelectElement).value as LangCode);
  }

  protected signOut(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
