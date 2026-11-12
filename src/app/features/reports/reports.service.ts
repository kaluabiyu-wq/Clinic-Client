import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Doctor } from '../../core/models/doctor.models';
import {
  DailyReport,
  ReportFilter,
  VisitsByHour,
  WaitReport,
} from '../../core/models/report.models';
import { environment } from '../../../environments/environment';

/**
 * Report endpoints from the API plan (Administrator only):
 *   GET /reports/daily
 *   GET /reports/waits
 *   GET /reports/visits-by-hour
 *   GET /reports/export.csv
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  getDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }

  getDaily(filter: ReportFilter): Observable<DailyReport> {
    return this.api.get<DailyReport>(`/reports/daily?${this.query(filter)}`);
  }

  getWaits(filter: ReportFilter): Observable<WaitReport> {
    return this.api.get<WaitReport>(`/reports/waits?${this.query(filter)}`);
  }

  getVisitsByHour(filter: ReportFilter): Observable<VisitsByHour[]> {
    return this.api.get<VisitsByHour[]>(
      `/reports/visits-by-hour?${this.query(filter)}`,
    );
  }

  /** The CSV comes back as a file, so this uses HttpClient with a blob response. */
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
