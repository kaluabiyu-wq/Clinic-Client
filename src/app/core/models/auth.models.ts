import { StaffRole } from './users.model';

export type { StaffRole } from './users.model';

/** The signed-in staff member, as returned by POST /auth/login and GET /auth/me. */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  /** Set for Clinician accounts: the doctor whose queue they work. */
  doctorId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

/** What is kept between page loads. */
export interface Session {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}
