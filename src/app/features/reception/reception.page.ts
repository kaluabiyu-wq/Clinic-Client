import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReceptionService } from './reception.service';
import {
  Appointment, CheckInResult, Doctor, PatientSearchResult, Slot
} from './reception.models';

function localToday(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string; title?: string } | null;
    if (error.status === 409) return body?.message ?? 'This action conflicts with an existing record. Refresh and try again.';
    if (error.status === 400) return body?.title ?? 'Please check the entered information.';
    if (error.status === 401 || error.status === 403) return 'Your account is not authorized for this action. Sign in with a receptionist account.';
    if (error.status === 0) return 'Cannot reach the clinic server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}

@Component({
  selector: 'app-reception-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './reception.page.html',
  styleUrl: './reception.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceptionPage {
  private readonly service = inject(ReceptionService);
  private readonly fb = inject(FormBuilder);

  protected readonly today = localToday();
  protected readonly date = signal(this.today);
  protected readonly doctorFilter = signal<number | null>(null);
  protected readonly statusFilter = signal('All');
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly patients = signal<PatientSearchResult[]>([]);
  protected readonly selectedPatient = signal<PatientSearchResult | null>(null);
  protected readonly slots = signal<Slot[]>([]);
  protected readonly selectedSlot = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly activePanel = signal<'none' | 'patient' | 'booking' | 'walkin'>('none');
  protected readonly lastCheckIn = signal<CheckInResult | null>(null);
  protected readonly duplicateWarning = signal<{ message: string; matches: unknown[] } | null>(null);
  protected readonly actionAppointment = signal<Appointment | null>(null);
  protected readonly rescheduleSlots = signal<Slot[]>([]);
  protected readonly rescheduleDate = signal(this.today);
  protected readonly rescheduleSlot = signal<string | null>(null);
  protected readonly cancelReason = signal('');

  protected readonly visibleAppointments = computed(() => {
    const status = this.statusFilter();
    return this.appointments().filter(a => status === 'All' || a.status === status);
  });
  protected readonly counts = computed(() => {
    const rows = this.appointments();
    return {
      total: rows.length,
      booked: rows.filter(a => a.status === 'Booked').length,
      waiting: rows.filter(a => a.status === 'Waiting').length,
      serving: rows.filter(a => a.status === 'Serving').length,
      completed: rows.filter(a => a.status === 'Completed').length,
    };
  });

  protected readonly patientForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+251|251|0)?[79]\d{8}$/)]],
    dateOfBirth: ['', Validators.required],
    sex: ['Male' as 'Male' | 'Female', Validators.required],
    address: [''],
  });
  protected readonly searchForm = this.fb.nonNullable.group({ query: [''] });
  protected readonly bookingForm = this.fb.nonNullable.group({
    date: [this.today, Validators.required],
    doctorId: [0, Validators.min(1)],
  });
  protected readonly walkInForm = this.fb.nonNullable.group({
    doctorId: [0, Validators.min(1)],
    fullName: [''],
    phoneNumber: [''],
    dateOfBirth: [''],
    sex: ['Male' as 'Male' | 'Female'],
  });

  constructor() {
    this.service.getDoctors().subscribe({
      next: doctors => this.doctors.set(doctors),
      error: err => this.error.set(errorMessage(err)),
    });
    this.loadAppointments();
  }

  protected loadAppointments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAppointments(this.date(), this.doctorFilter()).subscribe({
      next: rows => { this.appointments.set(rows); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); },
    });
  }
  protected onDateChange(value: string): void { this.date.set(value); this.loadAppointments(); }
  protected onDoctorFilter(value: string): void {
    this.doctorFilter.set(value ? Number(value) : null); this.loadAppointments();
  }
  protected onStatusFilter(value: string): void { this.statusFilter.set(value); }
  protected openPanel(panel: 'patient' | 'booking' | 'walkin'): void {
    this.error.set(null); this.notice.set(null); this.lastCheckIn.set(null);
    this.activePanel.set(panel);
  }
  protected closePanel(): void {
    this.activePanel.set('none'); this.duplicateWarning.set(null);
    this.selectedPatient.set(null); this.selectedSlot.set(null); this.slots.set([]);
  }
  protected searchPatients(): void {
    const q = this.searchForm.controls.query.value.trim();
    if (q.length < 2) { this.error.set('Enter at least two characters to search.'); return; }
    this.service.searchPatients(q).subscribe({
      next: rows => this.patients.set(rows),
      error: err => this.error.set(errorMessage(err)),
    });
  }
  protected choosePatient(patient: PatientSearchResult): void {
    this.selectedPatient.set(patient);
    this.notice.set(`${patient.fullName} selected.`);
  }
  protected createPatient(confirmNotDuplicate = false): void {
    if (this.patientForm.invalid || this.saving()) {
      this.patientForm.markAllAsTouched(); return;
    }
    this.saving.set(true); this.error.set(null);
    const v = this.patientForm.getRawValue();
    this.service.createPatient({ ...v, confirmNotDuplicate }).subscribe({
      next: patient => {
        this.saving.set(false); this.duplicateWarning.set(null);
        const selected = { id: patient.id, fullName: patient.fullName,
          phoneNumber: patient.phoneNumber, dateOfBirth: patient.dateOfBirth };
        this.selectedPatient.set(selected);
        this.patients.update(rows => [selected, ...rows.filter(p => p.id !== selected.id)]);
        this.notice.set(`Patient ${patient.fullName} registered successfully.`);
        this.patientForm.reset({ fullName: '', phoneNumber: '', dateOfBirth: '', sex: 'Male', address: '' });
      },
      error: err => {
        this.saving.set(false);
        if (err instanceof HttpErrorResponse && err.status === 409) {
          const body = err.error as { message?: string; possibleDuplicates?: unknown[] };
          this.duplicateWarning.set({ message: body?.message ?? 'Possible duplicate patient found.', matches: body?.possibleDuplicates ?? [] });
        } else this.error.set(errorMessage(err));
      },
    });
  }
  protected loadBookingSlots(): void {
    const { doctorId, date } = this.bookingForm.getRawValue();
    if (!doctorId || !date) return;
    this.selectedSlot.set(null); this.slots.set([]);
    this.service.getSlots(doctorId, date).subscribe({
      next: rows => this.slots.set(rows.filter(s => s.isAvailable)),
      error: err => this.error.set(errorMessage(err)),
    });
  }
  protected bookAppointment(): void {
    const patient = this.selectedPatient();
    const { doctorId, date } = this.bookingForm.getRawValue();
    const slotTime = this.selectedSlot();
    if (!patient || !doctorId || !date || !slotTime) {
      this.error.set('Select a patient, doctor, date and available time slot.'); return;
    }
    this.saving.set(true); this.error.set(null);
    this.service.book({ patientId: patient.id, doctorId, date, slotTime }).subscribe({
      next: appointment => {
        this.saving.set(false); this.notice.set(`Appointment ${appointment.reference} booked.`);
        this.closePanel(); this.date.set(date); this.loadAppointments();
      },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected submitWalkIn(): void {
    const patient = this.selectedPatient();
    const v = this.walkInForm.getRawValue();
    if (!v.doctorId || (!patient && (!v.fullName.trim() || !v.phoneNumber.trim() || !v.dateOfBirth))) {
      this.error.set('Select a doctor and an existing patient, or enter all required new-patient details.'); return;
    }
    this.saving.set(true); this.error.set(null);
    const request = patient
      ? { doctorId: v.doctorId, patientId: patient.id }
      : { doctorId: v.doctorId, fullName: v.fullName, phoneNumber: v.phoneNumber,
          dateOfBirth: v.dateOfBirth, sex: v.sex };
    this.service.walkIn(request).subscribe({
      next: result => {
        this.saving.set(false); this.lastCheckIn.set(result);
        this.notice.set(`Walk-in registered. Queue number ${result.queueNo}.`);
        this.loadAppointments();
      },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected checkIn(appointment: Appointment): void {
    if (this.saving()) return;
    this.saving.set(true); this.error.set(null);
    this.service.checkIn(appointment.id).subscribe({
      next: result => {
        this.saving.set(false); this.lastCheckIn.set(result);
        this.notice.set(`${appointment.patientName} checked in. Queue ${result.queueNo}.`);
        this.loadAppointments();
      },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected startReschedule(appointment: Appointment): void {
    this.actionAppointment.set(appointment);
    this.rescheduleDate.set(appointment.date);
    this.rescheduleSlot.set(null); this.rescheduleSlots.set([]);
    this.service.getSlots(appointment.doctorId, appointment.date).subscribe({
      next: rows => this.rescheduleSlots.set(rows.filter(s => s.isAvailable)),
      error: err => this.error.set(errorMessage(err)),
    });
  }
  protected updateRescheduleDate(value: string): void {
    this.rescheduleDate.set(value); this.rescheduleSlot.set(null); this.rescheduleSlots.set([]);
    const a = this.actionAppointment();
    if (!a || !value) return;
    this.service.getSlots(a.doctorId, value).subscribe({
      next: rows => this.rescheduleSlots.set(rows.filter(s => s.isAvailable)),
      error: err => this.error.set(errorMessage(err)),
    });
  }
  protected confirmReschedule(): void {
    const a = this.actionAppointment(), slot = this.rescheduleSlot();
    if (!a || !slot) { this.error.set('Choose an available new time.'); return; }
    this.saving.set(true);
    this.service.reschedule(a.reference, this.rescheduleDate(), slot).subscribe({
      next: () => { this.saving.set(false); this.actionAppointment.set(null); this.notice.set('Appointment rescheduled.'); this.loadAppointments(); },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected cancelAppointment(appointment: Appointment): void {
    if (!confirm(`Cancel appointment ${appointment.reference}?`)) return;
    this.saving.set(true);
    this.service.cancel(appointment.reference, this.cancelReason()).subscribe({
      next: () => { this.saving.set(false); this.notice.set('Appointment cancelled.'); this.actionAppointment.set(null); this.loadAppointments(); },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected noShow(appointment: Appointment): void {
    if (!confirm(`Mark ${appointment.patientName} as a no-show? This is only allowed more than 10 minutes after the appointment time.`)) return;
    this.saving.set(true);
    this.service.markNoShow(appointment.id).subscribe({
      next: () => { this.saving.set(false); this.notice.set('Patient marked as no-show.'); this.loadAppointments(); },
      error: err => { this.saving.set(false); this.error.set(errorMessage(err)); },
    });
  }
  protected statusClass(status: string): string { return status.toLowerCase().replace(/[^a-z]/g, ''); }
  protected closeAction(): void { this.actionAppointment.set(null); this.rescheduleSlot.set(null); }
}
