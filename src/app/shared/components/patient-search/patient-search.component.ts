import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  EMPTY,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { PatientSearchResult } from '../../../core/models/patient.models';

let nextId = 0;

/**
 * Type-ahead patient search (GET /patients?q=).
 *
 * - `selected` fires when the user picks a patient.
 * - `resultsChange` fires with every new result list, so a registration form
 *   can use it for the duplicate warning (FR2).
 */
@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './patient-search.component.html',
  styleUrl: './patient-search.component.scss',
})
export class PatientSearchComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() label = 'Find patient';
  @Input() placeholder = 'Name or phone number';
  @Input() minChars = 2;
  @Input() debounceMs = 300;
  /** Empty the box after a patient is picked (useful for "add to list" flows). */
  @Input() clearOnSelect = false;

  @Output() selected = new EventEmitter<PatientSearchResult>();
  @Output() resultsChange = new EventEmitter<PatientSearchResult[]>();

  readonly query = new FormControl('', { nonNullable: true });

  readonly results = signal<PatientSearchResult[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly searched = signal(false);
  readonly open = signal(false);
  readonly activeIndex = signal(-1);

  readonly inputId = `patient-search-${nextId}`;
  readonly listId = `patient-search-list-${nextId++}`;

  readonly activeId = computed(() =>
    this.activeIndex() >= 0 ? `${this.listId}-opt-${this.activeIndex()}` : null,
  );

  ngOnInit(): void {
    this.query.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        tap((q) => {
          this.activeIndex.set(-1);
          if (q.length < this.minChars) this.reset();
        }),
        switchMap((q) => (q.length < this.minChars ? EMPTY : this.search(q))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Lets a parent empty the search box, e.g. after a form is submitted. */
  clear(): void {
    this.query.setValue('', { emitEvent: false });
    this.reset();
  }

  onFocus(): void {
    if (this.results().length > 0) this.open.set(true);
  }

  onBlur(): void {
    this.open.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count === 0) return;
        this.open.set(true);
        this.moveActive((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count === 0) return;
        this.open.set(true);
        this.moveActive(this.activeIndex() <= 0 ? count - 1 : this.activeIndex() - 1);
        break;
      case 'Enter': {
        const patient = this.results()[this.activeIndex()];
        if (this.open() && patient) {
          event.preventDefault();
          this.select(patient);
        }
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.open.set(false);
        }
        break;
    }
  }

  select(patient: PatientSearchResult): void {
    this.open.set(false);
    this.activeIndex.set(-1);
    if (this.clearOnSelect) {
      this.clear();
    } else {
      this.query.setValue(patient.fullName, { emitEvent: false });
    }
    this.selected.emit(patient);
  }

  private search(q: string): Observable<PatientSearchResult[]> {
    this.loading.set(true);
    this.error.set(false);

    return this.api
      .get<PatientSearchResult[]>(`/patients?q=${encodeURIComponent(q)}`)
      .pipe(
        tap((results) => {
          this.results.set(results);
          this.searched.set(true);
          this.loading.set(false);
          this.open.set(true);
          this.resultsChange.emit(results);
        }),
        catchError(() => {
          this.results.set([]);
          this.loading.set(false);
          this.error.set(true);
          this.open.set(true);
          return EMPTY;
        }),
      );
  }

  private reset(): void {
    this.results.set([]);
    this.searched.set(false);
    this.loading.set(false);
    this.error.set(false);
    this.open.set(false);
    this.resultsChange.emit([]);
  }

  private moveActive(index: number): void {
    this.activeIndex.set(index);
    queueMicrotask(() =>
      document
        .getElementById(`${this.listId}-opt-${index}`)
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }
}
