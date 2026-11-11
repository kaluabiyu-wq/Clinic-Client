export type AppointmentStatus =
  | 'Booked'
  | 'Waiting'
  | 'Serving'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

/** Body of POST /appointments (public booking, no login). */
export interface BookAppointmentRequest {
  doctorId: number;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm */
  slotTime: string;
  patientName: string;
  phone: string;
  reason?: string | null;
}

export interface Appointment {
  id: number;
  /** e.g. APT1006 */
  reference: string;
  doctorId: number;
  doctorName: string;
  date: string;
  slotTime: string;
  status: AppointmentStatus;
}
