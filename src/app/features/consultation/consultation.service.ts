import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import { ConsultationRoom } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly api = inject(ApiService);

 
  getDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }

  
  getRoom(doctorId: number): Observable<ConsultationRoom> {
    return this.api.get<ConsultationRoom>(`/doctors/${doctorId}/room`);
  }

 
  watchRoom(doctorId: number, intervalMs = 10_000): Observable<PollResult<ConsultationRoom>> {
    return poll(() => this.getRoom(doctorId), intervalMs);
  }

 
  callNext(doctorId: number): Observable<unknown> {
    return this.api.post<unknown>(`/doctors/${doctorId}/call-next`, {});
  }

  
  complete(appointmentId: number): Observable<unknown> {
    return this.api.post<unknown>(`/appointments/${appointmentId}/complete`, {});
  }
}
