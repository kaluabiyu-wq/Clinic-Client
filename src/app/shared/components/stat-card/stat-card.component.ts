import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

export type StatCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgIf, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
})
export class StatCardComponent {
  
  @Input({ required: true }) label = '';

  @Input() value: number | string | null | undefined = null;

  @Input() unit = '';

  @Input() hint = '';

  @Input() variant: StatCardVariant = 'default';

  @Input() loading = false;

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  get variantClass(): string {
    return `stat-card--${this.variant}`;
  }
}