import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TrackQueue } from '../../core/models/queue.models';
import { TrackQueuePage } from './track-queue.page';
import { TrackQueueService } from './track-queue.service';

const waiting: TrackQueue = {
  reference: 'APT1006',
  doctorName: 'Dr. Test',
  status: 'Waiting',
  queueNumber: 'G005',
  peopleAhead: 2,
  estimatedWaitMinutes: 15,
  nowServing: 'G003',
};

describe('TrackQueuePage', () => {
  let fixture: ComponentFixture<TrackQueuePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackQueuePage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ reference: 'apt1006' }) } },
        },
        {
          provide: TrackQueueService,
          useValue: { watch: () => of({ ok: true as const, value: waiting }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackQueuePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows queue number, people ahead and estimated wait, but no patient name', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('G005');
    expect(text).toContain('~15 min');
    expect(text).toContain('Dr. Test');
    expect(text).toContain('People ahead of you');
  });
});
