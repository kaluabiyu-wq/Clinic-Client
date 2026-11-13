import { Component, OnInit, computed, inject, signal } from '@angular/core';

import {
  CreateStaffUser,
  STAFF_ROLES,
  StaffRole,
  StaffUser,
  UpdateStaffUser,
  UserId,
} from '../../core/models/users.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import {
  UserFormDialogComponent,
  UserFormValue,
} from './user-form-dialog.component';
import { UsersService } from './users.services';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [UserFormDialogComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage implements OnInit {
  private readonly service = inject(UsersService);
  private readonly toast = inject(ToastService);

  readonly roles = STAFF_ROLES;

  readonly users = signal<StaffUser[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  readonly query = signal('');
  readonly roleFilter = signal<StaffRole | ''>('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly dialogOpen = signal(false);
  readonly editing = signal<StaffUser | null>(null);
  readonly saving = signal(false);

  readonly confirmToggleId = signal<UserId | null>(null);
  readonly togglingId = signal<UserId | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users()
      .filter((u) => {
        if (role && u.role !== role) return false;
        if (status === 'active' && !u.isActive) return false;
        if (status === 'inactive' && u.isActive) return false;
        if (!q) return true;
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

  readonly activeCount = computed(
    () => this.users().filter((u) => u.isActive).length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.service.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
        this.toast.error('Could not load staff accounts.');
      },
    });
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as StaffRole | '');
  }

  onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  openCreate(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  openEdit(user: StaffUser): void {
    this.editing.set(user);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (this.saving()) return;
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  onDialogConfirmed(value: UserFormValue): void {
    const current = this.editing();
    if (current) {
      this.update(current, value);
    } else {
      this.create(value);
    }
  }

  private create(value: UserFormValue): void {
    const body: CreateStaffUser = {
      fullName: value.fullName.trim(),
      email: value.email.trim(),
      role: value.role,
      password: value.password,
    };
    this.saving.set(true);

    this.service.createUser(body).subscribe({
      next: (created) => {
        this.users.update((list) => [...list, created]);
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.toast.success('Account created.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(
          this.statusOf(err) === 409
            ? 'An account with this email already exists.'
            : 'Could not create the account. Check the details and try again.',
        );
      },
    });
  }

  private update(current: StaffUser, value: UserFormValue): void {
    const body: UpdateStaffUser = {
      fullName: value.fullName.trim(),
      role: value.role,
      isActive: current.isActive,
    };
    this.saving.set(true);

    this.service.updateUser(current.id, body).subscribe({
      next: (saved) => {
        this.replace(saved);
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.editing.set(null);
        this.toast.success('Account updated.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Could not update the account.');
      },
    });
  }

  askToggle(id: UserId): void {
    this.confirmToggleId.set(id);
  }

  cancelToggle(): void {
    this.confirmToggleId.set(null);
  }

  toggleActive(user: StaffUser): void {
    const body: UpdateStaffUser = {
      fullName: user.fullName,
      role: user.role,
      isActive: !user.isActive,
    };
    this.togglingId.set(user.id);

    this.service.updateUser(user.id, body).subscribe({
      next: (saved) => {
        this.replace(saved);
        this.togglingId.set(null);
        this.confirmToggleId.set(null);
        this.toast.success(saved.isActive ? 'Account activated.' : 'Account deactivated.');
      },
      error: () => {
        this.togglingId.set(null);
        this.toast.error('Could not change the account status.');
      },
    });
  }

  private replace(saved: StaffUser): void {
    this.users.update((list) => list.map((u) => (u.id === saved.id ? saved : u)));
  }

  private statusOf(err: unknown): number | undefined {
    return (err as { status?: number } | null)?.status;
  }
}