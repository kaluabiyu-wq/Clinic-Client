import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { CreateClosure } from '../../core/models/schedule.models';


function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

@Component({
  selector: 'app-closure-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './closure-dialog.component.html',
  styleUrl: './closure-dialog.component.scss',
})
export class ClosureDialogComponent {
  @Input({ required: true }) doctorName = '';
  /** Dates (yyyy-MM-dd) that already have a closure, so duplicates are blocked. */
  @Input() existingDates: string[] = [];
  @Input() saving = false;

  @Output() confirmed = new EventEmitter<CreateClosure>();
  @Output() cancelled = new EventEmitter<void>();

  readonly minDate = todayIso();

  readonly form = new FormGroup({
    date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.notDuplicate()],
    }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(200),
    }),
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.saving) this.cancelled.emit();
  }

  submit(): void {
    const { date } = this.form.controls;
    if (date.value && date.value < this.minDate) {
      date.setErrors({ past: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { date: d, reason } = this.form.getRawValue();
    this.confirmed.emit({ date: d, reason: reason.trim() || null });
  }

  private notDuplicate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      this.existingDates.includes(control.value) ? { duplicate: true } : null;
  }
}
