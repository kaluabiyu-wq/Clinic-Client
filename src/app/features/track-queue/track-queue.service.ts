import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { TrackQueue } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class TrackQueueService {
  private readonly api = inject(ApiService);

  /** GET /queue/track/{reference} (public; 404 when the reference is unknown) */
  track(reference: string): Observable<TrackQueue> {
    return this.api.get<TrackQueue>(`/queue/track/${encodeURIComponent(reference)}`);
  }

  /** Same call repeated every 10 s (SignalR is a later upgrade). */
  watch(reference: string, intervalMs = 10_000): Observable<PollResult<TrackQueue>> {
    return poll(() => this.track(reference), intervalMs);
  }
}
