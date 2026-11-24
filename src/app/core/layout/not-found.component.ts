import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { TranslateService } from '../i18n/translate.service';

/** Shown for any unknown URL (route: **). Public. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(TranslateService);

  protected readonly homeLink = computed(() =>
    this.auth.isAuthenticated() ? this.auth.homeFor(this.auth.role()) : '/book',
  );
}
