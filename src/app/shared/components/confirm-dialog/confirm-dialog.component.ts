import {
  ChangeDetectionStrategy,Component,
  ElementRef,EventEmitter,
  Input, OnChanges,Output,
  SimpleChanges,ViewChild,
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

export type ConfirmDialogVariant = 'default' | 'danger';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgIf, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'Please confirm';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: ConfirmDialogVariant = 'default';
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('cancelButton') cancelButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('confirmButton') confirmButton?: ElementRef<HTMLButtonElement>;

  readonly titleId = `confirm-title-${Math.random().toString(36).slice(2, 9)}`;
  readonly messageId = `confirm-message-${Math.random().toString(36).slice(2, 9)}`;

  private previouslyFocused: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['open'];
    if (!change) return;

    if (change.currentValue) {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
      setTimeout(() => this.cancelButton?.nativeElement.focus());
    } else if (!change.firstChange) {
      this.previouslyFocused?.focus();
      this.previouslyFocused = null;
    }
  }

  get variantClass(): string {
    return `confirm-dialog--${this.variant}`;
  }

  onConfirm(): void {
    if (this.busy) return;
    this.confirmed.emit();
  }

  onCancel(): void {
    if (this.busy) return;
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
      return;
    }

    if (event.key === 'Tab') {
      const first = this.cancelButton?.nativeElement;
      const last = this.confirmButton?.nativeElement;
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}