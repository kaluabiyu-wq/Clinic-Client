import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { QueueBoardCard } from '../../../core/models/queue.models';

@Component({
  selector: 'app-queue-card',
  standalone: true,
  templateUrl: './queue-card.component.html',
  styleUrl: './queue-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueCardComponent {
  readonly card = input.required<QueueBoardCard>();

  /** 0 -> "No wait", 15 -> "~15 min", 75 -> "~1 h 15 min", null -> "" */
  protected readonly waitLabel = computed(() => {
    const minutes = this.card().estimatedWaitMinutes;
    if (minutes === null || minutes === undefined) {
      return '';
    }
    if (minutes <= 0) {
      return 'No wait';
    }
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
  });
}