import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | CarePoint Clinic',
    loadChildren: () => import('./features/auth/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'reception',
    canActivate: [roleGuard('Receptionist', 'Administrator')],    title: 'Reception | CarePoint Clinic',
    loadChildren: () =>
      import('./features/reception/reception.routes').then((m) => m.RECEPTION_ROUTES),
  },
  {
    path: 'book',
    title: 'Book an appointment | CarePoint Clinic',
    loadChildren: () =>
      import('./features/booking/booking.routes').then((m) => m.BOOKING_ROUTES),
  },
  {
    path: 'track',
    title: 'Track queue | CarePoint Clinic',
    loadChildren: () =>
      import('./features/track-queue/track-queue.routes').then((m) => m.TRACK_QUEUE_ROUTES),
  },
  {
    path: 'board',
    title: 'Queue board | CarePoint Clinic',
    loadChildren: () =>
      import('./features/queue-board/queue-board.routes').then((m) => m.QUEUE_BOARD_ROUTES),
  },
  {
    path: 'consultation',
    canActivate: [roleGuard('Clinician', 'Administrator')],    title: 'Consultation | CarePoint Clinic',
    loadChildren: () =>
      import('./features/consultation/consultation.routes').then((m) => m.CONSULTATION_ROUTES),
  },
  {
    path: 'schedules',
    canActivate: [roleGuard('Administrator')],    title: 'Doctor schedules | CarePoint Clinic',
    loadChildren: () =>
      import('./features/schedules/schedules.routes').then((m) => m.SCHEDULES_ROUTES),
  },
  {
    path: 'reports',
    canActivate: [roleGuard('Administrator')],    title: 'Reports | CarePoint Clinic',
    loadChildren: () =>
      import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'users',
    canActivate: [roleGuard('Administrator')],    title: 'Staff accounts | CarePoint Clinic',
    loadChildren: () =>
      import('./features/admin-users/Admin-users.routes').then((m) => m.ADMIN_USERS_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'reception' },
  { path: '**', redirectTo: 'reception' },
];
