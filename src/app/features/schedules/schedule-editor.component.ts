import {
  Component,EventEmitter,
  Input,OnChanges,Output,SimpleChanges,inject,
} from '@angular/core';
import {
  AbstractControl,FormArray,
  FormControl,FormGroup,ReactiveFormsModule,
  ValidationErrors,Validators,
} from '@angular/forms';

import {
  DayOfWeekNumber,
  Schedule,
  ScheduleDay,
  UpsertSchedule,
} from '../../core/models/schedule.models';

const DAY_LABELS: Record<DayOfWeekNumber, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};


const DISPLAY_ORDER: DayOfWeekNumber[] = [1, 2, 3, 4, 5, 6, 0];

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}


function timeRangeValidator(group: AbstractControl): ValidationErrors | null {
  const isWorking = group.get('isWorking')?.value as boolean;
  const start = group.get('startTime')?.value as string;
  const end = group.get('endTime')?.value as string;
  if (!isWorking || !start || !end) return null;
  return toMinutes(end) > toMinutes(start) ? null : { timeRange: true };
}

type DayGroup = FormGroup<{
  dayOfWeek: FormControl<DayOfWeekNumber>;
  isWorking: FormControl<boolean>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
}>;

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './schedule-editor.component.html',
  styleUrl: './schedule-editor.component.scss',
})
export class ScheduleEditorComponent implements OnChanges {
  @Input({ required: true }) schedule!: Schedule;
  @Input() saving = false;
  @Output() save = new EventEmitter<UpsertSchedule>();

  readonly dayLabels = DAY_LABELS;

  readonly form = new FormGroup({
    slotMinutes: new FormControl(15, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(5), Validators.max(120)],
    }),
    days: new FormArray<DayGroup>([]),
  });

  get days(): FormArray<DayGroup> {
    return this.form.controls.days;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedule'] && this.schedule) {
      this.rebuild(this.schedule);
    }
  }


  slotCount(index: number): number {
    const day = this.days.at(index).getRawValue();
    const slot = this.form.controls.slotMinutes.value;
    if (!day.isWorking || !slot || slot < 1) return 0;
    const minutes = toMinutes(day.endTime) - toMinutes(day.startTime);
    return minutes > 0 ? Math.floor(minutes / slot) : 0;
  }

  onWorkingToggle(index: number): void {
    const group = this.days.at(index);
    const { startTime, endTime } = group.controls;
    if (group.controls.isWorking.value) {
      startTime.enable();
      endTime.enable();
    } else {
      startTime.disable();
      endTime.disable();
    }
  }

  
  copyFirstToAll(): void {
    const source = this.days.controls
      .map((g) => g.getRawValue())
      .find((d) => d.isWorking);
    if (!source) return;
    this.days.controls.forEach((g) => {
      if (g.controls.isWorking.value) {
        g.patchValue({ startTime: source.startTime, endTime: source.endTime });
      }
    });
    this.form.markAsDirty();
  }

  reset(): void {
    this.rebuild(this.schedule);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const days: ScheduleDay[] = raw.days
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isWorking: d.isWorking,
        startTime: d.startTime,
        endTime: d.endTime,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    this.save.emit({ slotMinutes: raw.slotMinutes, days });
  }

  private rebuild(schedule: Schedule): void {
    this.days.clear();
    for (const dow of DISPLAY_ORDER) {
      const existing = schedule.days.find((d) => d.dayOfWeek === dow);
      this.days.push(this.createDay(dow, existing));
    }
    this.form.controls.slotMinutes.setValue(schedule.slotMinutes || 15);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private createDay(dow: DayOfWeekNumber, day?: ScheduleDay): DayGroup {
    const isWorking = day?.isWorking ?? false;
    const group: DayGroup = new FormGroup(
      {
        dayOfWeek: new FormControl(dow, { nonNullable: true }),
        isWorking: new FormControl(isWorking, { nonNullable: true }),
        startTime: new FormControl(day?.startTime?.slice(0, 5) ?? '08:00', {
          nonNullable: true,
          validators: Validators.required,
        }),
        endTime: new FormControl(day?.endTime?.slice(0, 5) ?? '17:00', {
          nonNullable: true,
          validators: Validators.required,
        }),
      },
      { validators: timeRangeValidator },
    );
    if (!isWorking) {
      group.controls.startTime.disable();
      group.controls.endTime.disable();
    }
    return group;
  }
}
