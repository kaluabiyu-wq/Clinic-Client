import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Doctor } from '../../core/models/doctor.models';
import {
  DailyReport,
  ReportFilter,
  VisitsByHour,
  WaitReport,
} from '../../core/models/report.models';
import { ToastService } from '../../shared/components/toast/toast.service';
import { downloadBlob } from '../../shared/utils/csv-download';
import { DoctorSummaryComponent } from './doctor-summary.component';
import { ReportsService } from './reports.service';
import { VisitsByHourChartComponent } from './visits-by-hour-chart.component';

function toIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const from = group.get('from')?.value as string;
  const to = group.get('to')?.value as string;
  return from && to && from > to ? { range: true } : null;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    DoctorSummaryComponent,
    VisitsByHourChartComponent,
  ],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPage implements OnInit {
  private readonly service = inject(ReportsService);
  private readonly toast = inject(ToastService);

  readonly doctors = signal<Doctor[]>([]);
  readonly daily = signal<DailyReport | null>(null);
  readonly waits = signal<WaitReport | null>(null);
  readonly byHour = signal<VisitsByHour[]>([]);

  readonly loading = signal(false);
  readonly exporting = signal(false);

  readonly maxDate = toIso(new Date());

  readonly form = new FormGroup(
    {
      
      from: new FormControl(toIso(this.daysAgo(6)), {
        nonNullable: true,
        validators: Validators.required,
      }),
      to: new FormControl(toIso(new Date()), {
        nonNullable: true,
        validators: Validators.required,
      }),
      doctorId: new FormControl('', { nonNullable: true }),
    },
    { validators: rangeValidator },
  );

  ngOnInit(): void {
    this.service.getDoctors().subscribe({
      next: (doctors) => this.doctors.set(doctors),
      error: () => this.toast.error('Could not load doctors.'),
    });
    this.apply();
  }

  apply(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const filter = this.filter();
    this.loading.set(true);

    forkJoin({
      daily: this.service.getDaily(filter),
      waits: this.service.getWaits(filter),
      byHour: this.service.getVisitsByHour(filter),
    }).subscribe({
      next: ({ daily, waits, byHour }) => {
        this.daily.set(daily);
        this.waits.set(waits);
        this.byHour.set(byHour);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load the reports. Please try again.');
      },
    });
  }


  setRange(days: number): void {
    this.form.patchValue({
      from: toIso(this.daysAgo(days - 1)),
      to: toIso(new Date()),
    });
    this.apply();
  }

  exportCsv(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const filter = this.filter();
    this.exporting.set(true);

    this.service.exportCsv(filter).subscribe({
      next: (blob) => {
        downloadBlob(blob, `clinic-report_${filter.from}_${filter.to}.csv`);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error('Could not export the CSV.');
      },
    });
  }

  private filter(): ReportFilter {
    const { from, to, doctorId } = this.form.getRawValue();
    return { from, to, doctorId: doctorId || null };
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }
}
