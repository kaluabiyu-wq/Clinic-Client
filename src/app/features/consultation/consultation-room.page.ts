import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap } from 'rxjs';
import { Doctor } from '../../core/models/doctor.models';
import { ConsultationRoom } from '../../core/models/queue.models';
import { PollResult } from '../../shared/utils/polling';
import { ConsultationService } from './consultation.service';

const STORAGE_KEY = 'clinic.consultation.doctorId';

function readStoredDoctorId(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function storeDoctorId(id: number | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  } catch {
    // storage unavailable: the choice just is not remembered
  }
}

@Component({
  selector: 'app-consultation-room-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './consultation-room.page.html',
  styleUrl: './consultation-room.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationRoomPage {
  private readonly service = inject(ConsultationService);

  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly doctorId = signal<number | null>(readStoredDoctorId());
  protected readonly room = signal<ConsultationRoom | null>(null);
  protected readonly loaded = signal(false);
  protected readonly offline = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  /** "Now" as of the last refresh; waiting/consultation minutes are derived from it. */
  private readonly now = signal(Date.now());

  protected readonly busy = signal(false);
  protected readonly confirmingComplete = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Bumped to restart polling right away after an action. */
  private readonly refresh = signal(0);

  protected readonly canCallNext = computed(() => {
    const room = this.room();
    return (
      !this.busy() &&
      room !== null &&
      room.current === null &&
      room.waiting.length > 0
    );
  });

  constructor() {
    this.service
      .getDoctors()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => this.doctors.set(list),
        error: () => this.error.set('Could not load the doctor list.'),
      });

    toObservable(computed(() => ({ id: this.doctorId(), r: this.refresh() })))
      .pipe(
        switchMap(({ id }) => (id === null ? EMPTY : this.service.watchRoom(id))),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.apply(result));
  }

  protected onDoctorChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const id = value ? Number(value) : null;
    storeDoctorId(id);
    this.room.set(null);
    this.loaded.set(false);
    this.offline.set(false);
    this.error.set(null);
    this.confirmingComplete.set(false);
    this.doctorId.set(id);
  }

  protected callNext(): void {
    const id = this.doctorId();
    if (id === null || !this.canCallNext()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.service.callNext(id).subscribe({
      next: () => this.afterAction(),
      error: (err: unknown) => this.failAction(err),
    });
  }

  protected askComplete(): void {
    this.confirmingComplete.set(true);
  }

  protected cancelComplete(): void {
    this.confirmingComplete.set(false);
  }

  protected complete(): void {
    const current = this.room()?.current;
    if (!current || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.service.complete(current.appointmentId).subscribe({
      next: () => this.afterAction(),
      error: (err: unknown) => this.failAction(err),
    });
  }

  /** Whole minutes since an ISO timestamp, never negative. */
  protected minutesSince(iso: string | null): number {
    if (!iso) {
      return 0;
    }
    const diff = this.now() - Date.parse(iso);
    return Number.isFinite(diff) && diff > 0 ? Math.floor(diff / 60_000) : 0;
  }

  private afterAction(): void {
    this.busy.set(false);
    this.confirmingComplete.set(false);
    this.refresh.update((n) => n + 1);
  }

  private failAction(err: unknown): void {
    this.busy.set(false);
    this.confirmingComplete.set(false);
    if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
      this.error.set('You do not have permission to do this. Please sign in as a clinician.');
    } else if (err instanceof HttpErrorResponse && (err.status === 400 || err.status === 409)) {
      this.error.set('The queue just changed. Showing the latest list.');
    } else {
      this.error.set('Something went wrong. Please try again.');
    }
    this.refresh.update((n) => n + 1);
  }

  private apply(result: PollResult<ConsultationRoom>): void {
    this.loaded.set(true);
    if (result.ok) {
      this.room.set(result.value);
      this.now.set(Date.now());
      this.lastUpdated.set(new Date());
      this.offline.set(false);
    } else {
      this.offline.set(true);
    }
  }
}
