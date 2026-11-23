import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(AuthService);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly mobileMenuOpen = signal(false);

  protected readonly canReception = computed(() => this.auth.hasRole('Receptionist', 'Administrator'));
  protected readonly canConsult = computed(() => this.auth.hasRole('Clinician', 'Administrator'));
  protected readonly isAdmin = computed(() => this.auth.hasRole('Administrator'));

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.fullName ?? '';
    const parts = name.replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected signOut(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
