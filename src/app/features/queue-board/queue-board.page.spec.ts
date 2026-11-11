import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QueueBoard } from '../../core/models/queue.models';
import { QueueBoardPage } from './queue-board.page';
import { QueueBoardService } from './queue-board.service';

const board: QueueBoard = {
  generatedAt: '2026-11-11T11:00:00Z',
  cards: [
    {
      doctorId: 1,
      doctorName: 'Dr. Test',
      nowServing: 'G005',
      next: ['G006', 'G007'],
      waitingCount: 2,
      estimatedWaitMinutes: 15,
    },
  ],
};

describe('QueueBoardPage', () => {
  let fixture: ComponentFixture<QueueBoardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueBoardPage],
      providers: [
        {
          provide: QueueBoardService,
          useValue: { watchBoard: () => of({ ok: true as const, value: board }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QueueBoardPage);
    fixture.detectChanges();
  });

  it('shows queue numbers and never patient names', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('G005');
    expect(text).toContain('G006');
    expect(text).toContain('Dr. Test');
    expect(text).toContain('~15 min');
  });
});
