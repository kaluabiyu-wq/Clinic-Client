import { Routes } from '@angular/router';

export const QUEUE_BOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Queue board',
    loadComponent: () => import('./queue-board.page').then((m) => m.QueueBoardPage),
  },
];
