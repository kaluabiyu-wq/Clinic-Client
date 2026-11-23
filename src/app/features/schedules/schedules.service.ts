import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import {
  ClosureDto,
  DoctorDto,
  ScheduleDto,
  toClosure,
  toDoctor,
  toSchedule,
  toUpsertBody,
} from '../../core/api/adapters';
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
    return this.api.get<DoctorDto[]>('/doctors').pipe(map((list) => list.map(toDoctor)));
  }

  /** Weekly hours (GET schedule) combined with closures (GET closures, administrator only). */
  getSchedule(doctorId: number): Observable<Schedule> {
    return forkJoin({
      schedule: this.api.get<ScheduleDto>(`/doctors/${doctorId}/schedule`),
      closures: this.api.get<ClosureDto[]>(`/doctors/${doctorId}/closures`),
    }).pipe(map(({ schedule, closures }) => toSchedule(schedule, closures)));
  }

  saveSchedule(doctorId: number, body: UpsertSchedule): Observable<Schedule> {
    return this.api
      .put<ScheduleDto>(`/doctors/${doctorId}/schedule`, toUpsertBody(body.slotMinutes, body.days))
      .pipe(
        switchMap((saved) =>
          this.api
            .get<ClosureDto[]>(`/doctors/${doctorId}/closures`)
            .pipe(map((closures) => toSchedule(saved, closures))),
        ),
      );
  }

  addClosure(doctorId: number, body: CreateClosure): Observable<Closure> {
    return this.api.post<ClosureDto>(`/doctors/${doctorId}/closures`, body).pipe(map(toClosure));
  }

  removeClosure(doctorId: number, closureId: string): Observable<void> {
    return this.api.delete<void>(`/doctors/${doctorId}/closures/${closureId}`);
  }
}
