import { Routes } from '@angular/router';

export const RECEPTION_ROUTES: Routes = [
  {
    path: '',
    title: 'Reception desk',
    loadComponent: () => import('./reception.page').then((m) => m.ReceptionPage),
  },
];
