
export type DayOfWeekNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleDay {
  dayOfWeek: DayOfWeekNumber;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

export interface Closure {
  id: string;
 
  date: string;
  reason: string | null;
}


export interface Schedule {
  doctorId: string;
  slotMinutes: number;
  days: ScheduleDay[];
  closures: Closure[];
}


export interface UpsertSchedule {
  slotMinutes: number;
  days: ScheduleDay[];
}


export interface CreateClosure {
  date: string;
  reason: string | null;
}

export interface Slot {
  
  time: string;
  isAvailable: boolean;
}
