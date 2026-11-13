export interface Doctor {
  id: number;
  fullName: string;
  specialty?: string;
  letter: string;
  slotMinutes: number;
  isActive: boolean;
}