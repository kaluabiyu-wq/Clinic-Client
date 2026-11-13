import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  format?: (value: any, row: T) => string;
  cssClass?: string;
}

export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgFor, NgIf, NgTemplateOutlet, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T = any> implements OnChanges {
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() rows: T[] | null = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No records found';
  @Input() caption = '';
  @Input() pageSize = 0;
  @Input() trackByKey = 'id';
  @Input() clickableRows = false;
  @Input() cellTemplates: Record<string, TemplateRef<any>> = {};
  @Input() rowClass: ((row: T) => string) | null = null;

  @Output() rowClick = new EventEmitter<T>();
  @Output() sortChange = new EventEmitter<{ key: string; direction: SortDirection }>();

  @ContentChild('rowActions') rowActionsTemplate?: TemplateRef<any>;

  sortKey: string | null = null;
  sortDir: SortDirection = 'asc';
  page = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] || changes['pageSize']) {
      this.page = Math.min(this.page, this.totalPages);
    }
  }

  get sortedRows(): T[] {
    const data = [...(this.rows ?? [])];
    if (!this.sortKey) return data;

    const key = this.sortKey;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
      const av = this.getValue(a, key);
      const bv = this.getValue(b, key);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }

  get visibleRows(): T[] {
    const data = this.sortedRows;
    if (!this.pageSize) return data;
    const start = (this.page - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  get totalRows(): number {
    return this.rows?.length ?? 0;
  }

  get totalPages(): number {
    return this.pageSize ? Math.max(1, Math.ceil(this.totalRows / this.pageSize)) : 1;
  }

  get colspan(): number {
    return this.columns.length + (this.rowActionsTemplate ? 1 : 0);
  }

  getValue(row: T, key: string): any {
    return key.split('.').reduce((obj: any, part) => (obj == null ? obj : obj[part]), row);
  }

  display(col: DataTableColumn<T>, row: T): string {
    const value = this.getValue(row, col.key);
    if (col.format) return col.format(value, row);
    return value === null || value === undefined || value === '' ? '–' : String(value);
  }

  toggleSort(col: DataTableColumn<T>): void {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.page = 1;
    this.sortChange.emit({ key: this.sortKey, direction: this.sortDir });
  }

  ariaSort(col: DataTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    if (this.sortKey !== col.key) return 'none';
    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  goTo(page: number): void {
    this.page = Math.min(Math.max(1, page), this.totalPages);
  }

  onRowClick(row: T): void {
    if (this.clickableRows) this.rowClick.emit(row);
  }

  trackRow = (index: number, row: T): any => {
    const id = this.getValue(row, this.trackByKey);
    return id ?? index;
  };
}