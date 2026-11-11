import { Routes } from '@angular/router';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    title: 'Book an appointment',
    loadComponent: () => import('./booking.page').then((m) => m.BookingPage),
  },
  {
    path: 'confirmed/:reference',
    title: 'Appointment confirmed',
    loadComponent: () => import('./booking-confirm.page').then((m) => m.BookingConfirmPage),
  },
];
