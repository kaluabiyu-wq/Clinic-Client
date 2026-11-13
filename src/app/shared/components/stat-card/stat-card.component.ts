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
  /** Short title, e.g. "Total visits". Pass a translated string from assets/i18n. */
  @Input({ required: true }) label = '';

  /** Main figure. Use null/undefined while data is loading or missing. */
  @Input() value: number | string | null | undefined = null;

  /** Optional unit shown after the value, e.g. "min" or "%". */
  @Input() unit = '';

  /** Optional small helper text under the value, e.g. "Target: 15 min or less". */
  @Input() hint = '';

  /** Colour accent for the card. */
  @Input() variant: StatCardVariant = 'default';

  /** Shows a dimmed placeholder instead of the value. */
  @Input() loading = false;

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  get variantClass(): string {
    return `stat-card--${this.variant}`;
  }
}