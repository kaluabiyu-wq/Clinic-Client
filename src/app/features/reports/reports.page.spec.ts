import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ToastService } from '../../shared/components/toast/toast.service';
import { ReportsPage } from './reports.page';
import { ReportsService } from './reports.service';

describe('ReportsPage', () => {
  let fixture: ComponentFixture<ReportsPage>;
  let page: ReportsPage;
  let dailyCalls = 0;

  const reportsStub = {
    getDoctors: () => of([{ id: 'd1', fullName: 'Dr. Test' }]),
    getDaily: () => {
      dailyCalls++;
      return of({
        from: '2026-11-06',
        to: '2026-11-12',
        totalVisits: 5,
        cancellations: 1,
        noShows: 0,
        doctors: [
          {
            doctorId: 'd1',
            doctorName: 'Dr. Test',
            visits: 5,
            cancellations: 1,
            noShows: 0,
            averageWaitMinutes: 12,
          },
        ],
      });
    },
    getWaits: () =>
      of({ averageWaitMinutes: 12, longestWaitMinutes: 30, percentWithin15Minutes: 80 }),
    getVisitsByHour: () => of([{ hour: 9, visits: 3 }, { hour: 10, visits: 2 }]),
    exportCsv: () => of(new Blob(['a,b'])),
  };

  beforeEach(async () => {
    dailyCalls = 0;
    await TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        { provide: ReportsService, useValue: reportsStub },
        { provide: ToastService, useValue: { success() {}, error() {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the reports on init', () => {
    expect(dailyCalls).toBe(1);
    expect(page.daily()?.totalVisits).toBe(5);
    expect(page.waits()?.longestWaitMinutes).toBe(30);
  });

  it('renders the headline numbers', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Visits');
    expect(text).toContain('Dr. Test');
  });

  it('does not load when the start date is after the end date', () => {
    page.form.patchValue({ from: '2026-11-12', to: '2026-11-01' });
    page.apply();
    expect(dailyCalls).toBe(1);
    expect(page.form.hasError('range')).toBeTrue();
  });
});
