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
