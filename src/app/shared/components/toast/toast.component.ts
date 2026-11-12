import { Component, inject } from '@angular/core';

import { ToastService, ToastType } from './toast.service';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '!',
  info: 'i',
  warning: '!',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly service = inject(ToastService);
  readonly icons = ICONS;
}
