import { AppointmentStatus } from './appointment.models';


export interface QueueBoardCard {
  doctorId: number;
  doctorName: string;
  nowServing: string | null;
  next: string[];
  waitingCount: number;
  estimatedWaitMinutes: number | null;
}


export interface QueueBoard {
  generatedAt: string;
  cards: QueueBoardCard[];
}


export interface TrackQueue {
  reference: string;
  doctorName: string;
  status: AppointmentStatus;
  queueNumber: string | null;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
  nowServing: string | null;
}


export interface RoomPatient {
  appointmentId: number;
  queueNumber: string;
  patientName: string;
  reason: string | null;
  checkedInAt: string;
  startedAt: string | null;
}

export interface ConsultationRoom {
  doctorId: number;
  doctorName: string;
  current: RoomPatient | null;
  waiting: RoomPatient[];
}
