import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const MAX_VISIBLE = 4;


@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  success(message: string, durationMs = 4000): void {
    this.show('success', message, durationMs);
  }

 
  error(message: string, durationMs = 7000): void {
    this.show('error', message, durationMs);
  }

  info(message: string, durationMs = 4000): void {
    this.show('info', message, durationMs);
  }

  warning(message: string, durationMs = 6000): void {
    this.show('warning', message, durationMs);
  }

  
  show(type: ToastType, message: string, durationMs = 4000): void {
    
    const existing = this._toasts().find(
      (t) => t.type === type && t.message === message,
    );
    if (existing) {
      this.startTimer(existing.id, durationMs);
      return;
    }

    const toast: Toast = { id: this.nextId++, type, message };
    this._toasts.update((list) => {
      const next = [...list, toast];
      while (next.length > MAX_VISIBLE) {
        const removed = next.shift()!;
        this.clearTimer(removed.id);
      }
      return next;
    });
    this.startTimer(toast.id, durationMs);
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this._toasts.set([]);
  }

  private startTimer(id: number, durationMs: number): void {
    this.clearTimer(id);
    if (durationMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), durationMs),
      );
    }
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
