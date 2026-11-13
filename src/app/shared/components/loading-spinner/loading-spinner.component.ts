import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./loading-spinner.component.scss'],
  template: `
    <div
      class="spinner-wrapper"
      [class.overlay]="overlay"
      role="status"
      aria-live="polite"
      [attr.aria-label]="message"
    >
      <div
        class="spinner"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.border-width.px]="thickness"
      ></div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
      <span class="visually-hidden">{{ message || 'Loading' }}</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  /** Diameter of the spinner in pixels. */
  @Input() size = 40;

  /** Ring thickness in pixels. */
  @Input() thickness = 4;

  /** Optional text shown under the spinner. Pass a translated string from assets/i18n. */
  @Input() message = '';

  /** When true, covers the parent (which needs position: relative) with a dimmed backdrop. */
  @Input() overlay = false;
}