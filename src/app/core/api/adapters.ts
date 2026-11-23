/**
 * Adapters between the API's DTOs and the shapes the pages use.
 * Keeping the mapping here means the pages do not need to know the wire format.
 */
import { Doctor } from '../models/doctor.models';
import { QueueBoard, ConsultationRoom, RoomPatient, TrackQueue } from '../models/queue.models';
import { DailyReport, VisitsByHour, WaitReport } from '../models/report.models';
import { Closure, DayOfWeekNumber, Schedule, ScheduleDay, Slot } from '../models/schedule.models';
import { AppointmentStatus } from '../models/appointment.models';

// ---- Doctors ---------------------------------------------------------------
export interface DoctorDto {
  id: number;
  fullName: string;
  specialty: string;
  roomNumber?: string | null;
}

export function toDoctor(d: DoctorDto): Doctor {
  return { id: d.id, fullName: d.fullName, specialty: d.specialty, roomNumber: d.roomNumber ?? null, isActive: true };
}

// ---- Slots -----------------------------------------------------------------
export interface SlotDto {
  startTime: string; // "08:00:00"
  endTime: string;
}

/** The API only returns free slots, so every slot is available. Time is trimmed to HH:mm. */
export function toSlot(s: SlotDto): Slot {
  return { time: s.startTime.slice(0, 5), isAvailable: true };
}

// ---- Public queue ----------------------------------------------------------
export interface TrackQueueDto {
  reference: string;
  status: AppointmentStatus;
  date: string;
  slotTime: string;
  doctorName: string;
  roomNumber?: string | null;
  queueNo?: string | null;
  nowServing?: string | null;
  peopleAhead?: number | null;
  estimatedWaitMinutes?: number | null;
}

export function toTrackQueue(t: TrackQueueDto): TrackQueue {
  return {
    reference: t.reference,
    doctorName: t.doctorName,
    status: t.status,
    queueNumber: t.queueNo ?? null,
    peopleAhead: t.peopleAhead ?? null,
    estimatedWaitMinutes: t.estimatedWaitMinutes ?? null,
    nowServing: t.nowServing ?? null,
  };
}

export interface QueueBoardDto {
  updatedAtUtc: string;
  doctors: {
    doctorId: number;
    doctorName: string;
    roomNumber?: string | null;
    queueLetter: string;
    nowServing?: string | null;
    nextUp: string[];
    waitingCount: number;
  }[];
}

export function toQueueBoard(b: QueueBoardDto): QueueBoard {
  return {
    generatedAt: b.updatedAtUtc,
    cards: b.doctors.map((d) => ({
      doctorId: d.doctorId,
      doctorName: d.doctorName,
      nowServing: d.nowServing ?? null,
      next: d.nextUp ?? [],
      waitingCount: d.waitingCount,
      estimatedWaitMinutes: null, // not provided by the board endpoint
    })),
  };
}

// ---- Consultation room -----------------------------------------------------
interface QueueEntryDto {
  appointmentId: number;
  reference: string;
  queueNo: string;
  patientName: string;
  isWalkIn: boolean;
  slotTime: string;
  checkInAt?: string | null;
  startAt?: string | null;
  minutesWaiting?: number | null;
}

export interface ConsultationRoomDto {
  doctorId: number;
  doctorName: string;
  roomNumber?: string | null;
  current?: QueueEntryDto | null;
  waiting: QueueEntryDto[];
}

function toRoomPatient(e: QueueEntryDto): RoomPatient {
  return {
    appointmentId: e.appointmentId,
    queueNumber: e.queueNo,
    patientName: e.patientName,
    reason: e.isWalkIn ? 'Walk-in' : null,
    checkedInAt: e.checkInAt ?? '',
    startedAt: e.startAt ?? null,
  };
}

export function toConsultationRoom(r: ConsultationRoomDto): ConsultationRoom {
  return {
    doctorId: r.doctorId,
    doctorName: r.doctorName,
    current: r.current ? toRoomPatient(r.current) : null,
    waiting: (r.waiting ?? []).map(toRoomPatient),
  };
}

// ---- Schedules -------------------------------------------------------------
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function dayNumber(day: string | number): DayOfWeekNumber {
  if (typeof day === 'number') return day as DayOfWeekNumber;
  const i = DAY_NAMES.indexOf(day as (typeof DAY_NAMES)[number]);
  return (i < 0 ? 0 : i) as DayOfWeekNumber;
}

export function dayName(day: number): string {
  return DAY_NAMES[day];
}

export interface ScheduleDayDto {
  dayOfWeek: string | number;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}

export interface ScheduleDto {
  doctorId: number;
  days: ScheduleDayDto[];
}

export interface ClosureDto {
  id: number;
  date: string;
  reason?: string | null;
}

export function toClosure(c: ClosureDto): Closure {
  return { id: String(c.id), date: c.date, reason: c.reason ?? null };
}

export function toSchedule(s: ScheduleDto, closures: ClosureDto[]): Schedule {
  const days: ScheduleDay[] = s.days.map((d) => ({
    dayOfWeek: dayNumber(d.dayOfWeek),
    isWorking: true,
    startTime: d.openTime.slice(0, 5),
    endTime: d.closeTime.slice(0, 5),
  }));
  return {
    doctorId: String(s.doctorId),
    slotMinutes: s.days[0]?.slotMinutes ?? 15,
    days,
    closures: closures.map(toClosure),
  };
}

/** The editor sends every weekday; the API wants only the working ones (others become days off). */
export function toUpsertBody(slotMinutes: number, days: ScheduleDay[]) {
  return {
    days: days
      .filter((d) => d.isWorking)
      .map((d) => ({
        dayOfWeek: dayName(d.dayOfWeek),
        openTime: d.startTime.length === 5 ? `${d.startTime}:00` : d.startTime,
        closeTime: d.endTime.length === 5 ? `${d.endTime}:00` : d.endTime,
        slotMinutes,
      })),
  };
}

// ---- Reports ---------------------------------------------------------------
export interface DailyReportDto {
  from: string;
  to: string;
  totals: { total: number; visits: number; cancellations: number; noShows: number; walkIns: number; open: number };
  doctors: {
    doctorId: number;
    doctorName: string;
    visits: number;
    cancellations: number;
    noShows: number;
    averageWaitMinutes?: number | null;
  }[];
}

export function toDailyReport(r: DailyReportDto): DailyReport {
  return {
    from: r.from,
    to: r.to,
    totalVisits: r.totals.visits,
    cancellations: r.totals.cancellations,
    noShows: r.totals.noShows,
    doctors: r.doctors.map((d) => ({
      doctorId: String(d.doctorId),
      doctorName: d.doctorName,
      visits: d.visits,
      cancellations: d.cancellations,
      noShows: d.noShows,
      averageWaitMinutes: d.averageWaitMinutes ?? 0,
    })),
  };
}

export interface WaitReportDto {
  averageWaitMinutes?: number | null;
  longestWaitMinutes?: number | null;
  shareWithin15MinutesPercent?: number | null;
}

export function toWaitReport(w: WaitReportDto): WaitReport {
  return {
    averageWaitMinutes: w.averageWaitMinutes ?? 0,
    longestWaitMinutes: w.longestWaitMinutes ?? 0,
    percentWithin15Minutes: w.shareWithin15MinutesPercent ?? 0,
  };
}

export type VisitsByHourDto = VisitsByHour;
