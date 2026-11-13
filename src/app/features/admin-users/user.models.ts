
export type UserId = string;

export type StaffRole = 'Administrator' | 'Receptionist' | 'Clinician';

export const STAFF_ROLES: readonly StaffRole[] = [
  'Administrator',
  'Receptionist',
  'Clinician',
];


export interface StaffUser {
  id: UserId;
  fullName: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
}


export interface CreateStaffUser {
  fullName: string;
  email: string;
  role: StaffRole;
  password: string;
}


export interface UpdateStaffUser {
  fullName: string;
  role: StaffRole;
  isActive: boolean;
}