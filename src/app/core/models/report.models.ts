
export interface ReportFilter {
  from: string;
  to: string;
  doctorId?: string | null;
}


export interface DoctorReportRow {
  doctorId: string;
  doctorName: string;
  visits: number;
  cancellations: number;
  noShows: number;
  averageWaitMinutes: number;
}


export interface DailyReport {
  from: string;
  to: string;
  totalVisits: number;
  cancellations: number;
  noShows: number;
  doctors: DoctorReportRow[];
}


export interface WaitReport {
  averageWaitMinutes: number;
  longestWaitMinutes: number;
  percentWithin15Minutes: number;
}


export interface VisitsByHour {
  hour: number;
  visits: number;
}
