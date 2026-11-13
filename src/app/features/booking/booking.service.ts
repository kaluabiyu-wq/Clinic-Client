import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Appointment, BookAppointmentRequest } from '../../core/models/appointment.models';
import { Doctor } from '../../core/models/doctor.models';
import { Slot } from '../../core/models/schedule.models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly api = inject(ApiService);

  /** GET /doctors */
  getDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }

  /** GET /doctors/{id}/slots?date=yyyy-MM-dd (free slots only) */
  getSlots(doctorId: number, date: string): Observable<Slot[]> {
    return this.api.get<Slot[]>(`/doctors/${doctorId}/slots`, { date });
  }

  /** POST /appointments (409 Conflict when the slot was just taken) */
  book(request: BookAppointmentRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', request);
  }
}
