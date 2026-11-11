import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QueueBoardCard } from '../../../core/models/queue.models';
import { WaitMinutesPipe } from '../../pipes/wait-minutes.pipe';

@Component({
  selector: 'app-queue-card',
  standalone: true,
  imports: [WaitMinutesPipe],
  templateUrl: './queue-card.component.html',
  styleUrl: './queue-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueCardComponent {
  readonly card = input.required<QueueBoardCard>();
}
