import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Appointment } from '../../core/models/appointment.models';
import { formatSlotTime } from '../../shared/utils/date-utils';

@Component({
  selector: 'app-booking-confirm-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './booking-confirm.page.html',
  styleUrl: './booking-confirm.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmPage {
  protected readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';

  /** Passed via router state; missing after a page refresh, so the template falls back to the reference only. */
  protected readonly appointment: Appointment | null =
    (history.state?.appointment as Appointment | undefined) ?? null;

  protected readonly label = formatSlotTime;
}
