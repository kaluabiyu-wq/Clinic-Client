/** Query filter shared by every report endpoint. Dates are "yyyy-MM-dd". */
export interface ReportFilter {
  from: string;
  to: string;
  /** Omit or null for all doctors. */
  doctorId?: string | null;
}

/** One row of the per-doctor summary. Aggregates only, no patient data. */
export interface DoctorReportRow {
  doctorId: string;
  doctorName: string;
  visits: number;
  cancellations: number;
  noShows: number;
  averageWaitMinutes: number;
}

/** GET /reports/daily */
export interface DailyReport {
  from: string;
  to: string;
  totalVisits: number;
  cancellations: number;
  noShows: number;
  doctors: DoctorReportRow[];
}

/** GET /reports/waits */
export interface WaitReport {
  averageWaitMinutes: number;
  longestWaitMinutes: number;
  /** 0 to 100: share of visits that waited 15 minutes or less. */
  percentWithin15Minutes: number;
}

/** One bar of GET /reports/visits-by-hour. Hour is 0 to 23, local time. */
export interface VisitsByHour {
  hour: number;
  visits: number;
}
