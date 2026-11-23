import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DoctorDto, SlotDto, toDoctor, toSlot } from '../../core/api/adapters';
import { ApiService } from '../../core/api/api.service';
import { Appointment, BookAppointmentRequest } from '../../core/models/appointment.models';
import { Doctor } from '../../core/models/doctor.models';
import { Slot } from '../../core/models/schedule.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly api = inject(ApiService);

  /** GET /doctors */
  getDoctors(): Observable<Doctor[]> {
    return this.api.get<DoctorDto[]>('/doctors').pipe(map((list) => list.map(toDoctor)));
  }

  /** GET /doctors/{id}/slots?date=yyyy-MM-dd (free slots only) */
  getSlots(doctorId: number, date: string): Observable<Slot[]> {
    return this.api
      .get<SlotDto[]>(`/doctors/${doctorId}/slots`, { date })
      .pipe(map((list) => list.map(toSlot)));
  }

  /** POST /appointments (409 Conflict when the slot was just taken) */
  book(request: BookAppointmentRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', {
      doctorId: request.doctorId,
      date: request.date,
      slotTime: request.slotTime.length === 5 ? `${request.slotTime}:00` : request.slotTime,
      fullName: request.patientName,
      phoneNumber: request.phone,
      dateOfBirth: request.dateOfBirth,
      sex: request.sex,
    });
  }
}
