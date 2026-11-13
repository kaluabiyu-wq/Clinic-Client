import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import {
  Closure,
  CreateClosure,
  Schedule,
  UpsertSchedule,
} from '../../core/models/schedule.models';

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private readonly api = inject(ApiService);

  getDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }

  getSchedule(doctorId: number): Observable<Schedule> {
    return this.api.get<Schedule>(`/doctors/${doctorId}/schedule`);
  }

  saveSchedule(doctorId: number, body: UpsertSchedule): Observable<Schedule> {
    return this.api.put<Schedule>(`/doctors/${doctorId}/schedule`, body);
  }

  addClosure(doctorId: number, body: CreateClosure): Observable<Closure> {
    return this.api.post<Closure>(`/doctors/${doctorId}/closures`, body);
  }

  removeClosure(doctorId: number, closureId: string): Observable<void> {
    return this.api.delete<void>(`/doctors/${doctorId}/closures/${closureId}`);
  }
}