import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { QueueBoard } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class QueueBoardService {
  private readonly api = inject(ApiService);

 
  getBoard(): Observable<QueueBoard> {
    return this.api.get<QueueBoard>('/queue/board');
  }


  watchBoard(intervalMs = 10_000): Observable<PollResult<QueueBoard>> {
    return poll(() => this.getBoard(), intervalMs);
  }
}
