import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { PatientSearchResult } from '../../../core/models/patient.models';
import { PatientSearchComponent } from './patient-search.component';

describe('PatientSearchComponent', () => {
  let fixture: ComponentFixture<PatientSearchComponent>;
  let component: PatientSearchComponent;
  let calls: string[];

  const patients: PatientSearchResult[] = [
    { id: 'p1', fullName: 'Abel Test', phone: '0911000001', dateOfBirth: '1990-04-02' },
    { id: 'p2', fullName: 'Abebe Demo', phone: '0911000002', dateOfBirth: null },
  ];

  beforeEach(async () => {
    calls = [];
    await TestBed.configureTestingModule({
      imports: [PatientSearchComponent],
      providers: [
        {
          provide: ApiService,
          useValue: {
            get: (path: string) => {
              calls.push(path);
              return of(patients);
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function type(value: string): void {
    component.query.setValue(value);
    tick(300);
    fixture.detectChanges();
  }

  it('does not search below the minimum length', fakeAsync(() => {
    type('a');
    expect(calls.length).toBe(0);
  }));

  it('searches after the debounce and lists the results', fakeAsync(() => {
    type('abe');
    expect(calls).toEqual(['/patients?q=abe']);
    expect(component.results().length).toBe(2);
    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(2);
  }));

  it('emits the patient when an option is clicked', fakeAsync(() => {
    let picked: PatientSearchResult | undefined;
    component.selected.subscribe((p) => (picked = p));

    type('abe');
    fixture.nativeElement.querySelector('[role="option"]').click();

    expect(picked?.id).toBe('p1');
    expect(component.open()).toBeFalse();
  }));

  it('selects with the keyboard', fakeAsync(() => {
    let picked: PatientSearchResult | undefined;
    component.selected.subscribe((p) => (picked = p));

    type('abe');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(picked?.id).toBe('p2');
    tick();
  }));
});
