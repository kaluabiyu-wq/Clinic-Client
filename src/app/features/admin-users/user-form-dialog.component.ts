import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { STAFF_ROLES, StaffRole, StaffUser } from '../../core/models/users.model';

export interface UserFormValue {
  fullName: string;
  email: string;
  role: StaffRole;
  password: string;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
  host: { '(document:keydown.escape)': 'cancelled.emit()' },
})
export class UserFormDialogComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  /** null = create a new account, otherwise edit this one. */
  readonly user = input<StaffUser | null>(null);
  readonly saving = input(false);

  readonly confirmed = output<UserFormValue>();
  readonly cancelled = output<void>();

  readonly roles = STAFF_ROLES;
  readonly isEdit = computed(() => this.user() !== null);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    role: ['Receptionist' as StaffRole, Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const existing = this.user();
    if (!existing) return;

    this.form.patchValue({
      fullName: existing.fullName,
      email: existing.email,
      role: existing.role,
    });
    // Email is the sign-in name and the update endpoint does not change it.
    // Passwords are not part of an edit.
    this.form.controls.email.disable();
    this.form.controls.password.disable();
  }

  invalid(name: 'fullName' | 'email' | 'role' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // getRawValue includes the disabled email/password controls in edit mode.
    this.confirmed.emit(this.form.getRawValue());
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelled.emit();
  }
}