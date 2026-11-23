export type AppointmentStatus =
  | 'Booked'
  | 'Waiting'
  | 'Serving'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';


export interface BookAppointmentRequest {
  doctorId: number;
  date: string;
  slotTime: string;
  patientName: string;
  phone: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female';
}

export interface Appointment {
  id: number;
  reference: string;
  doctorId: number;
  doctorName: string;
  date: string;
  slotTime: string;
  status: AppointmentStatus;
}
