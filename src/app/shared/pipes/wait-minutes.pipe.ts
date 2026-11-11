import { Pipe, PipeTransform } from '@angular/core';

/** 0 -> "No wait", 15 -> "~15 min", 75 -> "~1 h 15 min", null -> "" */
@Pipe({ name: 'waitMinutes', standalone: true })
export class WaitMinutesPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) {
      return '';
    }
    if (minutes <= 0) {
      return 'No wait';
    }
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
  }
}
