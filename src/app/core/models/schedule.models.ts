/** Day of week follows .NET DayOfWeek: 0 = Sunday ... 6 = Saturday. */
export type DayOfWeekNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleDay {
  dayOfWeek: DayOfWeekNumber;
  isWorking: boolean;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

export interface Closure {
  id: string;
  /** ISO date, "yyyy-MM-dd" */
  date: string;
  reason: string | null;
}

/** GET /doctors/{id}/schedule */
export interface Schedule {
  doctorId: string;
  slotMinutes: number;
  days: ScheduleDay[];
  closures: Closure[];
}

/** PUT /doctors/{id}/schedule */
export interface UpsertSchedule {
  slotMinutes: number;
  days: ScheduleDay[];
}

/** POST /doctors/{id}/closures */
export interface CreateClosure {
  date: string;
  reason: string | null;
}

export interface Slot {
  /** "HH:mm" */
  time: string;
  isAvailable: boolean;
}
