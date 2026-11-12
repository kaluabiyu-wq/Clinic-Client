import { Component, Input, computed, signal } from '@angular/core';

import { VisitsByHour } from '../../core/models/report.models';

interface Bar {
  hour: number;
  label: string;
  visits: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 12, bottom: 32, left: 36 };

/** Pure SVG column chart, so no charting library is needed. */
@Component({
  selector: 'app-visits-by-hour-chart',
  standalone: true,
  templateUrl: './visits-by-hour-chart.component.html',
  styleUrl: './visits-by-hour-chart.component.scss',
})
export class VisitsByHourChartComponent {
  private readonly _data = signal<VisitsByHour[]>([]);

  @Input({ required: true }) set data(value: VisitsByHour[]) {
    this._data.set(value ?? []);
  }

  readonly width = WIDTH;
  readonly height = HEIGHT;

  /** Always shows at least 08:00 to 17:00, widening if there is data outside. */
  readonly hours = computed(() => {
    const withData = this._data().filter((d) => d.visits > 0);
    const min = Math.min(8, ...withData.map((d) => d.hour));
    const max = Math.max(17, ...withData.map((d) => d.hour));
    const list: number[] = [];
    for (let h = min; h <= max; h++) list.push(h);
    return list;
  });

  readonly maxVisits = computed(() => {
    const peak = Math.max(0, ...this._data().map((d) => d.visits));
    // Round the axis up to a tidy number so gridlines read well.
    if (peak <= 5) return 5;
    const step = peak <= 20 ? 5 : 10;
    return Math.ceil(peak / step) * step;
  });

  readonly ticks = computed(() => {
    const max = this.maxVisits();
    const count = 4;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    return Array.from({ length: count + 1 }, (_, i) => {
      const value = Math.round((max / count) * i);
      return { value, y: PAD.top + plotH - (value / max) * plotH };
    });
  });

  readonly bars = computed<Bar[]>(() => {
    const hours = this.hours();
    const max = this.maxVisits();
    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const slot = plotW / hours.length;
    const barW = Math.min(slot * 0.6, 36);
    const byHour = new Map(this._data().map((d) => [d.hour, d.visits]));

    return hours.map((hour, i) => {
      const visits = byHour.get(hour) ?? 0;
      const height = (visits / max) * plotH;
      return {
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        visits,
        x: PAD.left + slot * i + (slot - barW) / 2,
        y: PAD.top + plotH - height,
        width: barW,
        height,
      };
    });
  });

  readonly total = computed(() =>
    this._data().reduce((sum, d) => sum + d.visits, 0),
  );

  readonly padLeft = PAD.left;
  readonly padRight = PAD.right;
  readonly baseline = HEIGHT - PAD.bottom;
}
