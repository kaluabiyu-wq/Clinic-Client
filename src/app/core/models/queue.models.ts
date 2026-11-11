import { AppointmentStatus } from './appointment.models';

/** One doctor's column on the public board. Never contains patient names. */
export interface QueueBoardCard {
  doctorId: number;
  doctorName: string;
  /** Queue number being served now, e.g. "G005"; null when nobody is in consultation */
  nowServing: string | null;
  /** Next queue numbers in arrival order (API decides how many, e.g. 3) */
  next: string[];
  waitingCount: number;
  /** Rounded to the nearest 5 minutes by the API (WaitEstimator) */
  estimatedWaitMinutes: number | null;
}

/** Response of GET /queue/board (public) */
export interface QueueBoard {
  generatedAt: string;
  cards: QueueBoardCard[];
}

/** Response of GET /queue/track/{reference} (public). Never contains the patient's name. */
export interface TrackQueue {
  reference: string;
  doctorName: string;
  status: AppointmentStatus;
  /** Issued at check-in; null while status is "Booked" */
  queueNumber: string | null;
  /** People waiting before this patient; null unless status is "Waiting" */
  peopleAhead: number | null;
  /** Rounded to the nearest 5 minutes by the API (WaitEstimator) */
  estimatedWaitMinutes: number | null;
  /** Queue number the doctor is serving now */
  nowServing: string | null;
}

/** A patient as seen by clinic staff (names are allowed on staff screens, never on public ones). */
export interface RoomPatient {
  appointmentId: number;
  queueNumber: string;
  patientName: string;
  reason: string | null;
  /** ISO timestamp; used to derive waiting time (StartAt - CheckInAt) */
  checkedInAt: string;
  /** ISO timestamp; set once the patient is called in */
  startedAt: string | null;
}

/** Staff view of one doctor's room: GET /doctors/{id}/room */
export interface ConsultationRoom {
  doctorId: number;
  doctorName: string;
  /** Patient currently in consultation (status Serving), or null */
  current: RoomPatient | null;
  /** Checked-in patients waiting, in arrival order */
  waiting: RoomPatient[];
}
