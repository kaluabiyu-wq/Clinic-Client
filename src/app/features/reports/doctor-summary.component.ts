import { DecimalPipe } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

import { DoctorReportRow } from '../../core/models/report.models';

@Component({
  selector: 'app-doctor-summary',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './doctor-summary.component.html',
  styleUrl: './doctor-summary.component.scss',
})
export class DoctorSummaryComponent {
  private readonly _rows = signal<DoctorReportRow[]>([]);

  @Input({ required: true }) set rows(value: DoctorReportRow[]) {
    this._rows.set(value ?? []);
  }

  readonly data = this._rows.asReadonly();

  readonly totals = computed(() => {
    const rows = this._rows();
    const visits = rows.reduce((sum, r) => sum + r.visits, 0);
    return {
      visits,
      cancellations: rows.reduce((sum, r) => sum + r.cancellations, 0),
      noShows: rows.reduce((sum, r) => sum + r.noShows, 0),
      averageWait:
        visits === 0
          ? 0
          : rows.reduce((sum, r) => sum + r.averageWaitMinutes * r.visits, 0) /
            visits,
    };
  });
}
