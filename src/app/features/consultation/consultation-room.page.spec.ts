import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConsultationRoom } from '../../core/models/queue.models';
import { ConsultationRoomPage } from './consultation-room.page';
import { ConsultationService } from './consultation.service';

const waitingOnly: ConsultationRoom = {
  doctorId: 1,
  doctorName: 'Dr. Test',
  current: null,
  waiting: [
    {
      appointmentId: 11,
      queueNumber: 'G005',
      patientName: 'Fictional Patient',
      reason: 'Check-up',
      checkedInAt: new Date().toISOString(),
      startedAt: null,
    },
  ],
};

const inConsultation: ConsultationRoom = {
  ...waitingOnly,
  current: { ...waitingOnly.waiting[0], startedAt: new Date().toISOString() },
  waiting: [],
};

function setup(room: ConsultationRoom): ComponentFixture<ConsultationRoomPage> {
  localStorage.setItem('clinic.consultation.doctorId', '1');
  TestBed.configureTestingModule({
    imports: [ConsultationRoomPage],
    providers: [
      {
        provide: ConsultationService,
        useValue: {
          getDoctors: () => of([{ id: 1, fullName: 'Dr. Test', specialty: 'GP' }]),
          watchRoom: () => of({ ok: true as const, value: room }),
          callNext: () => of({}),
          complete: () => of({}),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ConsultationRoomPage);
  fixture.detectChanges();
  return fixture;
}

describe('ConsultationRoomPage', () => {
  afterEach(() => localStorage.removeItem('clinic.consultation.doctorId'));

  it('lets the clinician call the next patient when the room is empty', () => {
    const fixture = setup(waitingOnly);
    const el = fixture.nativeElement as HTMLElement;
    const button = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Call next patient'),
    ) as HTMLButtonElement;

    expect(el.textContent).toContain('G005');
    expect(button.disabled).toBe(false);
  });

  it('hides "Call next" while a patient is in consultation and offers to finish the visit', () => {
    const fixture = setup(inConsultation);
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';

    expect(text).not.toContain('Call next patient');
    expect(text).toContain('Finish visit');
  });
});
