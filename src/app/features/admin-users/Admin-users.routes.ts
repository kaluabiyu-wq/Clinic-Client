import { Routes } from '@angular/router';

export const ADMIN_USERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Staff accounts',
    loadComponent: () => import('./users.page').then((m) => m.UsersPage),
  },
];