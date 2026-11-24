import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { guestGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { AuthService } from './core/auth/auth.service';

/**
 * Route map (see roadmap section 10).
 *  /login            public, full page
 *  shell routes      frame (sidebar + top bar) around every feature page
 *    public:  /book, /track, /board
 *    staff:   /reception, /consultation (role), /schedules, /reports, /users (Administrator)
 *  **                public 404
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in | CarePoint Clinic',
    loadComponent: () => import('./core/layout/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'reception',
        canActivate: [roleGuard('Receptionist', 'Administrator')],
        title: 'Reception | CarePoint Clinic',
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
        canActivate: [roleGuard('Clinician', 'Administrator')],
        title: 'Consultation | CarePoint Clinic',
        loadChildren: () =>
          import('./features/consultation/consultation.routes').then((m) => m.CONSULTATION_ROUTES),
      },
      {
        path: 'schedules',
        canActivate: [roleGuard('Administrator')],
        title: 'Doctor schedules | CarePoint Clinic',
        loadChildren: () =>
          import('./features/schedules/schedules.routes').then((m) => m.SCHEDULES_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard('Administrator')],
        title: 'Reports | CarePoint Clinic',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'users',
        canActivate: [roleGuard('Administrator')],
        title: 'Staff accounts | CarePoint Clinic',
        loadChildren: () =>
          import('./features/admin-users/Admin-users.routes').then((m) => m.ADMIN_USERS_ROUTES),
      },
      {
        path: '',
        pathMatch: 'full',
        // Signed-in staff land on their role's home page; everyone else on public booking.
        redirectTo: () => {
          const auth = inject(AuthService);
          return auth.isAuthenticated() ? auth.homeFor(auth.role()) : '/book';
        },
      },
    ],
  },
  {
    path: '**',
    title: 'Page not found | CarePoint Clinic',
    loadComponent: () => import('./core/layout/not-found.component').then((m) => m.NotFoundComponent),
  },
];
