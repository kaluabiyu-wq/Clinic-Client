import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  DailyReportDto,
  DoctorDto,
  WaitReportDto,
  toDailyReport,
  toDoctor,
  toWaitReport,
} from '../../core/api/adapters';

import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import {
  DailyReport,
  ReportFilter,
  VisitsByHour,
  WaitReport,
} from '../../core/models/report.models';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  getDoctors(): Observable<Doctor[]> {
    return this.api.get<DoctorDto[]>('/doctors').pipe(map((list) => list.map(toDoctor)));
  }

  getDaily(filter: ReportFilter): Observable<DailyReport> {
    return this.api
      .get<DailyReportDto>(`/reports/daily?${this.query(filter)}`)
      .pipe(map(toDailyReport));
  }

  getWaits(filter: ReportFilter): Observable<WaitReport> {
    return this.api
      .get<WaitReportDto>(`/reports/waits?${this.query(filter)}`)
      .pipe(map(toWaitReport));
  }

  getVisitsByHour(filter: ReportFilter): Observable<VisitsByHour[]> {
    return this.api.get<VisitsByHour[]>(
      `/reports/visits-by-hour?${this.query(filter)}`,
    );
  }

  
  exportCsv(filter: ReportFilter): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/reports/export.csv?${this.query(filter)}`,
      { responseType: 'blob' },
    );
  }

  private query(filter: ReportFilter): string {
    const params = new URLSearchParams({ from: filter.from, to: filter.to });
    if (filter.doctorId) params.set('doctorId', filter.doctorId);
    return params.toString();
  }
}
