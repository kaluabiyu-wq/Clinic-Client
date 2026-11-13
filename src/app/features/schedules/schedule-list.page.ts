import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Doctor } from '../../core/models/doctor.models';
import {
  CreateClosure,
  Schedule,
  UpsertSchedule,
} from '../../core/models/schedule.models';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ClosureDialogComponent } from './closure-dialog.component';
import { ScheduleEditorComponent } from './schedule-editor.component';
import { SchedulesService } from './schedules.service';

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

@Component({
  selector: 'app-schedule-list-page',
  standalone: true,
  imports: [DatePipe, ScheduleEditorComponent, ClosureDialogComponent],
  templateUrl: './schedule-list.page.html',
  styleUrl: './schedule-list.page.scss',
})
export class ScheduleListPage implements OnInit {
  private readonly service = inject(SchedulesService);
  private readonly toast = inject(ToastService);

  readonly today = todayIso();

  readonly doctors = signal<Doctor[]>([]);
  readonly selectedDoctorId = signal<number | null>(null);
  readonly schedule = signal<Schedule | null>(null);

  readonly loadingDoctors = signal(true);
  readonly loadingSchedule = signal(false);
  readonly saving = signal(false);
  readonly savingClosure = signal(false);

  readonly showClosureDialog = signal(false);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly selectedDoctor = computed(
    () => this.doctors().find((d) => d.id === this.selectedDoctorId()) ?? null,
  );

  readonly sortedClosures = computed(() =>
    [...(this.schedule()?.closures ?? [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  );

  readonly closureDates = computed(() => this.sortedClosures().map((c) => c.date));

  ngOnInit(): void {
    this.service.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loadingDoctors.set(false);
        if (doctors.length === 1) this.onDoctorChange(doctors[0].id);
      },
      error: () => {
        this.loadingDoctors.set(false);
        this.toast.error('Could not load doctors.');
      },
    });
  }

  onDoctorChange(doctorId: number): void {
    if (!doctorId) return;
    this.selectedDoctorId.set(doctorId);
    this.schedule.set(null);
    this.confirmDeleteId.set(null);
    this.loadingSchedule.set(true);

    this.service.getSchedule(doctorId).subscribe({
      next: (schedule) => {
        // Ignore a late response if the admin already switched doctors.
        if (this.selectedDoctorId() !== doctorId) return;
        this.schedule.set(schedule);
        this.loadingSchedule.set(false);
      },
      error: () => {
        if (this.selectedDoctorId() !== doctorId) return;
        this.loadingSchedule.set(false);
        this.toast.error('Could not load this doctor’s schedule.');
      },
    });
  }

  onSave(body: UpsertSchedule): void {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;
    this.saving.set(true);

    this.service.saveSchedule(doctorId, body).subscribe({
      next: (saved) => {
        this.schedule.set(saved);
        this.saving.set(false);
        this.toast.success('Schedule saved.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Could not save the schedule. Please try again.');
      },
    });
  }

  openClosureDialog(): void {
    this.showClosureDialog.set(true);
  }

  closeClosureDialog(): void {
    this.showClosureDialog.set(false);
  }

  onClosureConfirmed(body: CreateClosure): void {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;
    this.savingClosure.set(true);

    this.service.addClosure(doctorId, body).subscribe({
      next: (closure) => {
        this.schedule.update((s) =>
          s ? { ...s, closures: [...s.closures, closure] } : s,
        );
        this.savingClosure.set(false);
        this.showClosureDialog.set(false);
        this.toast.success('Closure added.');
      },
      error: () => {
        this.savingClosure.set(false);
        this.toast.error('Could not add the closure.');
      },
    });
  }

  askRemove(closureId: string): void {
    this.confirmDeleteId.set(closureId);
  }

  cancelRemove(): void {
    this.confirmDeleteId.set(null);
  }

  removeClosure(closureId: string): void {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;

    this.service.removeClosure(doctorId, closureId).subscribe({
      next: () => {
        this.schedule.update((s) =>
          s ? { ...s, closures: s.closures.filter((c) => c.id !== closureId) } : s,
        );
        this.confirmDeleteId.set(null);
        this.toast.success('Closure removed.');
      },
      error: () => this.toast.error('Could not remove the closure.'),
    });
  }
}
