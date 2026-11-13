import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type StatusKey = 'booked' | 'waiting' | 'serving' | 'completed' | 'cancelled' | 'noshow' | 'unknown';

const LABELS: Record<StatusKey, string> = {
  booked: 'Booked',
  waiting: 'Waiting',
  serving: 'Serving',
  completed: 'Completed',
  cancelled: 'Cancelled',
  noshow: 'No-show',
  unknown: 'Unknown',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined = '';
  @Input() label = '';

  get key(): StatusKey {
    const normalized = (this.status ?? '').toString().toLowerCase().replace(/[^a-z]/g, '');
    return normalized in LABELS ? (normalized as StatusKey) : 'unknown';
  }

  get text(): string {
    return this.label || LABELS[this.key];
  }

  get statusClass(): string {
    return `status-badge--${this.key}`;
  }
}