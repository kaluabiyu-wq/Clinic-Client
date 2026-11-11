import { Routes } from '@angular/router';

export const CONSULTATION_ROUTES: Routes = [
  {
    path: '',
    title: 'Consultation room',
    loadComponent: () =>
      import('./consultation-room.page').then((m) => m.ConsultationRoomPage),
  },
];
