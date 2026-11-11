import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { DoctorSummary } from '../../core/models/doctor.models';
import { ConsultationRoom } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly api = inject(ApiService);

  /** GET /doctors */
  getDoctors(): Observable<DoctorSummary[]> {
    return this.api.get<DoctorSummary[]>('/doctors');
  }

  /** GET /doctors/{id}/room (not in the PDF endpoint list: see ConsultationRoomDto) */
  getRoom(doctorId: number): Observable<ConsultationRoom> {
    return this.api.get<ConsultationRoom>(`/doctors/${doctorId}/room`);
  }

  /** The room refreshed every 10 s so new check-ins appear without reloading. */
  watchRoom(doctorId: number, intervalMs = 10_000): Observable<PollResult<ConsultationRoom>> {
    return poll(() => this.getRoom(doctorId), intervalMs);
  }

  /** POST /doctors/{id}/call-next (Clinician) */
  callNext(doctorId: number): Observable<unknown> {
    return this.api.post<unknown>(`/doctors/${doctorId}/call-next`, {});
  }

  /** POST /appointments/{id}/complete (Clinician); the API stamps the end time */
  complete(appointmentId: number): Observable<unknown> {
    return this.api.post<unknown>(`/appointments/${appointmentId}/complete`, {});
  }
}
