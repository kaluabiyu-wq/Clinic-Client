import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { STAFF_ROLES, StaffRole, StaffUser } from '../../core/models/users.model';

export interface UserFormValue {
  fullName: string;
  email: string;
  role: StaffRole;
  password: string;
  doctorId: string;
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
    password: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    doctorId: [''],
  });

  private readonly api = inject(ApiService);
  readonly doctors = signal<Doctor[]>([]);
  readonly role = toSignal(
    this.form.controls.role.valueChanges.pipe(startWith(this.form.controls.role.value), map((r) => r)),
    { initialValue: 'Receptionist' as StaffRole },
  );
  readonly needsDoctor = computed(() => this.role() === 'Clinician');

  ngOnInit(): void {
    this.api.get<Doctor[]>('/doctors').subscribe({ next: (d) => this.doctors.set(d), error: () => this.doctors.set([]) });
    const existing = this.user();
    if (!existing) return;

    this.form.patchValue({
      fullName: existing.fullName,
      email: existing.email,
      role: existing.role,
      doctorId: existing.doctorId ?? '',
    });
    // Email is the sign-in name and the update endpoint does not change it.
    // Passwords are not part of an edit.
    this.form.controls.email.disable();
    this.form.controls.password.disable();
  }

  invalid(name: 'fullName' | 'email' | 'role' | 'password' | 'doctorId'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.saving()) return;
    if (this.needsDoctor() && !this.form.controls.doctorId.value) {
      this.form.controls.doctorId.markAsTouched();
      return;
    }
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