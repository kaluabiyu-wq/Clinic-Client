import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Doctor } from '../../core/models/doctor.models';
import { Slot } from '../../core/models/schedule.models';
import { SlotGridComponent } from '../../shared/components/slot-grid/slot-grid.component';
import { addDaysIso, formatSlotTime, todayIso } from '../../shared/utils/date-utils';
import { BookingService } from './booking.service';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [ReactiveFormsModule, SlotGridComponent],
  templateUrl: './booking.page.html',
  styleUrl: './booking.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPage {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly minDate = todayIso();
  protected readonly maxDate = addDaysIso(todayIso(), 60);
  protected readonly label = formatSlotTime;

  // Step 1-2 state
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly doctorsLoading = signal(true);
  protected readonly doctorId = signal<number | null>(null);
  protected readonly date = signal(todayIso());

  // Step 3 state
  protected readonly slots = signal<Slot[]>([]);
  protected readonly slotsLoading = signal(false);
  protected readonly selectedSlot = signal<string | null>(null);
  private readonly refresh = signal(0);

  // Submit state
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    patientName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    // +2519xxxxxxxx, 2519xxxxxxxx, 09xxxxxxxx, 07xxxxxxxx
    phone: ['', [Validators.required, Validators.pattern(/^(\+251|251|0)?[79]\d{8}$/)]],
    reason: ['', [Validators.maxLength(300)]],
  });

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(map((s) => s === 'VALID')),
    { initialValue: false },
  );

  protected readonly selectedDoctor = computed(
    () => this.doctors().find((d) => d.id === this.doctorId()) ?? null,
  );

  protected readonly canSubmit = computed(
    () =>
      this.formValid() &&
      this.doctorId() !== null &&
      this.selectedSlot() !== null &&
      !this.submitting(),
  );

  constructor() {
    this.bookingService
      .getDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.doctors.set(list);
          this.doctorsLoading.set(false);
        },
        error: () => {
          this.doctorsLoading.set(false);
          this.error.set('Could not load doctors. Please check your connection and try again.');
        },
      });

    // Reload free slots whenever doctor, date or refresh counter changes.
    toObservable(
      computed(() => ({ doctorId: this.doctorId(), date: this.date(), r: this.refresh() })),
    )
      .pipe(
        tap(() => {
          this.selectedSlot.set(null);
          this.slots.set([]);
        }),
        switchMap(({ doctorId, date }) => {
          if (doctorId === null || !date) {
            return of<Slot[]>([]);
          }
          this.slotsLoading.set(true);
          return this.bookingService.getSlots(doctorId, date).pipe(
            catchError(() => {
              this.error.set('Could not load time slots. Please try again.');
              return of<Slot[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.slots.set(list);
        this.slotsLoading.set(false);
      });
  }

  protected onDoctorChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.error.set(null);
    this.doctorId.set(value ? Number(value) : null);
  }

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.error.set(null);
    this.date.set(value);
  }

  protected onSlotSelected(time: string): void {
    this.selectedSlot.set(time);
  }

  protected submit(): void {
    const doctorId = this.doctorId();
    const slotTime = this.selectedSlot();
    if (this.form.invalid || doctorId === null || slotTime === null || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { patientName, phone, reason } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    this.bookingService
      .book({
        doctorId,
        date: this.date(),
        slotTime,
        patientName: patientName.trim(),
        phone: phone.trim(),
        reason: reason.trim() || null,
      })
      .subscribe({
        next: (appointment) => {
          this.submitting.set(false);
          this.router.navigate(['/book/confirmed', appointment.reference], {
            state: { appointment },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          if (err.status === 409) {
            // Someone else took the slot: refresh the grid so they can pick another.
            this.error.set('Sorry, that slot was just taken. Please choose another time.');
            this.refresh.update((n) => n + 1);
          } else if (err.status === 400 || err.status === 422) {
            this.error.set(err.error?.detail ?? 'Please check your details and try again.');
          } else {
            this.error.set('Something went wrong. Please try again.');
          }
        },
      });
  }
}
