import { Routes } from '@angular/router';

export const TRACK_QUEUE_ROUTES: Routes = [
  {
    path: '',
    title: 'Track my queue',
    loadComponent: () => import('./track-queue.page').then((m) => m.TrackQueuePage),
  },
];
