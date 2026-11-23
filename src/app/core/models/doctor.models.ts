export interface Doctor {
  id: number;
  fullName: string;
  specialty?: string;
  roomNumber?: string | null;
  isActive?: boolean;
}
