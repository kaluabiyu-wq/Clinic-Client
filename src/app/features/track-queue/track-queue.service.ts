import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TrackQueueDto, toTrackQueue } from '../../core/api/adapters';
import { ApiService } from '../../core/api/api.service';
import { TrackQueue } from '../../core/models/queue.models';
import { PollResult, poll } from '../../shared/utils/polling';

@Injectable({ providedIn: 'root' })
export class TrackQueueService {
  private readonly api = inject(ApiService);

  
  track(reference: string): Observable<TrackQueue> {
    return this.api
      .get<TrackQueueDto>(`/queue/track/${encodeURIComponent(reference)}`)
      .pipe(map(toTrackQueue));
  }

  
  watch(reference: string, intervalMs = 10_000): Observable<PollResult<TrackQueue>> {
    return poll(() => this.track(reference), intervalMs);
  }
}
