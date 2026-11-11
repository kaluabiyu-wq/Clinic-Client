import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueueBoard } from '../../core/models/queue.models';
import { QueueCardComponent } from '../../shared/components/queue-card/queue-card.component';
import { QueueBoardService } from './queue-board.service';

@Component({
  selector: 'app-queue-board-page',
  standalone: true,
  imports: [QueueCardComponent, DatePipe],
  templateUrl: './queue-board.page.html',
  styleUrl: './queue-board.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueBoardPage {
  private readonly service = inject(QueueBoardService);

  protected readonly board = signal<QueueBoard | null>(null);
  protected readonly loaded = signal(false);
  /** True when the latest refresh failed; the last good data stays on screen. */
  protected readonly offline = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    this.service
      .watchBoard()
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.loaded.set(true);
        if (result.ok) {
          this.board.set(result.value);
          this.lastUpdated.set(new Date());
          this.offline.set(false);
        } else {
          this.offline.set(true);
        }
      });
  }
}
