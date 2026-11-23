export type AppointmentStatus =
  | 'Booked' | 'Waiting' | 'Serving' | 'Completed' | 'Cancelled' | 'NoShow';

export interface Patient {
  id: number;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female';
  address?: string | null;
  createdAt?: string;
}
export interface PatientSearchResult {
  id: number;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
}
export interface Doctor {
  id: number;
  fullName: string;
  specialty?: string | null;
  letter?: string;
  slotMinutes?: number;
  isActive?: boolean;
}
export interface Slot { time: string; isAvailable: boolean; }
export interface Appointment {
  id: number;
  reference: string;
  doctorId: number;
  doctorName: string;
  roomNumber?: string | null;
  patientId: number;
  patientName: string;
  patientPhone: string;
  date: string;
  slotTime: string;
  status: AppointmentStatus;
  isWalkIn: boolean;
  queueNo?: string | null;
  createdAt: string;
}
export interface CheckInResult {
  appointmentId: number;
  reference: string;
  queueNo: string;
  doctorName: string;
  roomNumber?: string | null;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  checkInAt: string;
}
export interface CreatePatientRequest {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female';
  address?: string | null;
  confirmNotDuplicate: boolean;
}
export interface WalkInRequest {
  doctorId: number;
  patientId?: number;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  sex?: 'Male' | 'Female';
}
export interface BookForPatientRequest {
  doctorId: number;
  date: string;
  slotTime: string;
  patientId: number;
}
