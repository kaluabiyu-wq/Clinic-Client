import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConsultationRoomDto, DoctorDto, toConsultationRoom, toDoctor } from '../../core/api/adapters';
import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import { ConsultationRoom } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly api = inject(ApiService);

 
  getDoctors(): Observable<Doctor[]> {
    return this.api.get<DoctorDto[]>('/doctors').pipe(map((list) => list.map(toDoctor)));
  }

  
  getRoom(doctorId: number): Observable<ConsultationRoom> {
    return this.api
      .get<ConsultationRoomDto>(`/doctors/${doctorId}/consultation-room`)
      .pipe(map(toConsultationRoom));
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
