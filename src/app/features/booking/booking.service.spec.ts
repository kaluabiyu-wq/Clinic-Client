import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests free slots for a doctor and date', () => {
    service.getSlots(3, '2026-11-12').subscribe((slots) => {
      expect(slots).toEqual([{ time: '09:00' }]);
    });

    const req = http.expectOne((r) => r.url === '/api/doctors/3/slots');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2026-11-12');
    req.flush([{ time: '09:00' }]);
  });

  it('posts a booking and surfaces 409 conflicts', () => {
    let status = 0;
    service
      .book({ doctorId: 3, date: '2026-11-12', slotTime: '09:00', patientName: 'Test', phone: '0911223344' })
      .subscribe({ error: (e) => (status = e.status) });

    http.expectOne('/api/appointments').flush({}, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
