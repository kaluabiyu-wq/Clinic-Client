import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, switchMap, takeWhile } from 'rxjs';
import { AppointmentStatus } from '../../core/models/appointment.models';
import { TrackQueue } from '../../core/models/queue.models';
import { PollResult } from '../../shared/utils/polling';
import { TrackQueueService } from './track-queue.service';

const FINAL_STATUSES: AppointmentStatus[] = ['Completed', 'Cancelled', 'NoShow'];

function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

@Component({
  selector: 'app-track-queue-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './track-queue.page.html',
  styleUrl: './track-queue.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackQueuePage {
  private readonly service = inject(TrackQueueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    // e.g. APT1006
    reference: ['', [Validators.required, Validators.pattern(/^APT\d{3,}$/i)]],
  });

  private attempt = 0;
  private readonly request = signal<{ reference: string; n: number } | null>(null);

  protected readonly info = signal<TrackQueue | null>(null);
  protected readonly loaded = signal(false);
  protected readonly notFound = signal(false);
  /** Latest refresh failed; the last good data stays on screen. */
  protected readonly offline = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  /** Polling stopped because the visit ended or the reference is unknown. */
  protected readonly finished = signal(false);
  protected readonly searching = computed(() => this.request() !== null && !this.loaded());

  constructor() {
    toObservable(this.request)
      .pipe(
        switchMap((req) => {
          this.info.set(null);
          this.loaded.set(false);
          this.notFound.set(false);
          this.offline.set(false);
          this.finished.set(false);
          if (!req) {
            return EMPTY;
          }
          // inclusive takeWhile: the last (final) result is still delivered, then polling stops
          return this.service
            .watch(req.reference)
            .pipe(takeWhile((result) => !this.isFinal(result), true));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.apply(result));

    // Deep link from the confirmation page: /track?reference=APT1006
    const initial = this.route.snapshot.queryParamMap.get('reference');
    if (initial) {
      this.form.controls.reference.setValue(initial.trim().toUpperCase());
      this.start();
    }
  }

  protected start(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const reference = this.form.getRawValue().reference.trim().toUpperCase();
    this.form.controls.reference.setValue(reference);
    this.request.set({ reference, n: ++this.attempt });
    // Empty commands keep the current path and only update ?reference= so the link can be shared.
    this.router.navigate([], { queryParams: { reference }, replaceUrl: true });
  }

  protected waitLabel(minutes: number | null | undefined): string {
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
  }

  private isFinal(result: PollResult<TrackQueue>): boolean {
    return result.ok ? FINAL_STATUSES.includes(result.value.status) : isNotFound(result.error);
  }

  private apply(result: PollResult<TrackQueue>): void {
    this.loaded.set(true);
    if (result.ok) {
      this.info.set(result.value);
      this.lastUpdated.set(new Date());
      this.offline.set(false);
      this.notFound.set(false);
      this.finished.set(FINAL_STATUSES.includes(result.value.status));
    } else if (isNotFound(result.error)) {
      this.info.set(null);
      this.notFound.set(true);
      this.finished.set(true);
    } else {
      this.offline.set(true);
    }
  }
}
