import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { TranslateService } from '../i18n/translate.service';

/** Staff sign-in page (route: /login, public). Full page, no sidebar. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(TranslateService);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.auth.homeFor(this.auth.role()));
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorKey.set(null);

    this.auth.login(email.trim(), password).subscribe({
      next: (res) => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/login')
            ? returnUrl
            : this.auth.homeFor(res.user.role);
        void this.router.navigateByUrl(target);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorKey.set(
          err.status === 401 ? 'login.invalid' : err.status === 0 ? 'login.offline' : 'login.failed',
        );
      },
    });
  }
}
