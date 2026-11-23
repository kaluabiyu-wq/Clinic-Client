import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SlotDto, toSlot } from '../../core/api/adapters';
import { ApiService } from '../../core/api/api.service';
import {
  Appointment, BookForPatientRequest, CheckInResult, CreatePatientRequest,
  Doctor, Patient, PatientSearchResult, Slot, WalkInRequest
} from './reception.models';

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private readonly api = inject(ApiService);

  getAppointments(date: string, doctorId?: number | null): Observable<Appointment[]> {
    return this.api.get<Appointment[]>('/appointments', { date, doctorId });
  }
  getDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }
  searchPatients(q: string): Observable<PatientSearchResult[]> {
    return this.api.get<PatientSearchResult[]>('/patients', { q });
  }
  createPatient(request: CreatePatientRequest): Observable<Patient> {
    return this.api.post<Patient>('/patients', request);
  }
  getSlots(doctorId: number, date: string): Observable<Slot[]> {
    return this.api
      .get<SlotDto[]>(`/doctors/${doctorId}/slots`, { date })
      .pipe(map((list) => list.map(toSlot)));
  }
  book(request: BookForPatientRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', {
      ...request,
      slotTime: request.slotTime.length === 5 ? `${request.slotTime}:00` : request.slotTime,
    });
  }
  checkIn(appointmentId: number): Observable<CheckInResult> {
    return this.api.post<CheckInResult>(`/appointments/${appointmentId}/check-in`, {});
  }
  walkIn(request: WalkInRequest): Observable<CheckInResult> {
    return this.api.post<CheckInResult>('/walk-ins', request);
  }
  reschedule(reference: string, newDate: string, newSlotTime: string): Observable<Appointment> {
    return this.api.put<Appointment>(`/appointments/${encodeURIComponent(reference)}/reschedule`,
      {
      newDate,
      newSlotTime: newSlotTime.length === 5 ? `${newSlotTime}:00` : newSlotTime,
    });
  }
  cancel(reference: string, reason?: string): Observable<Appointment> {
    return this.api.post<Appointment>(`/appointments/${encodeURIComponent(reference)}/cancel`,
      { reason: reason || null });
  }
  markNoShow(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(`/appointments/${id}/no-show`, {});
  }
}
