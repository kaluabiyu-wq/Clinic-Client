import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Slot } from '../../../core/models/schedule.models';
import { formatSlotTime } from '../../utils/date-utils';

@Component({
  selector: 'app-slot-grid',
  standalone: true,
  templateUrl: './slot-grid.component.html',
  styleUrl: './slot-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotGridComponent {
  readonly slots = input.required<Slot[]>();
  readonly selected = input<string | null>(null);
  readonly disabled = input(false);
  readonly selectedChange = output<string>();

  protected readonly label = formatSlotTime;

  protected pick(time: string): void {
    if (!this.disabled()) {
      this.selectedChange.emit(time);
    }
  }
}
