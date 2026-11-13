import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableColumn, DataTableComponent } from './data-table.component';

interface Row {
  id: number;
  queueNo: string;
  status: string;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Row>>;
  let component: DataTableComponent<Row>;

  const columns: DataTableColumn<Row>[] = [
    { key: 'queueNo', header: 'Queue No', sortable: true },
    { key: 'status', header: 'Status' },
  ];

  const rows: Row[] = [
    { id: 1, queueNo: 'G003', status: 'Waiting' },
    { id: 2, queueNo: 'G001', status: 'Serving' },
    { id: 3, queueNo: 'G002', status: 'Waiting' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent<Row>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
  });

  it('renders one body row per record', () => {
    const trs = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(trs.length).toBe(3);
  });

  it('shows the empty message when there are no rows', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('emptyMessage', 'Nobody in the queue');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nobody in the queue');
  });

  it('shows the spinner while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-spinner')).toBeTruthy();
  });

  it('sorts ascending then descending when a sortable header is clicked', () => {
    component.toggleSort(columns[0]);
    expect(component.sortedRows.map((r) => r.queueNo)).toEqual(['G001', 'G002', 'G003']);

    component.toggleSort(columns[0]);
    expect(component.sortedRows.map((r) => r.queueNo)).toEqual(['G003', 'G002', 'G001']);
  });

  it('paginates rows when pageSize is set', () => {
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();
    expect(component.visibleRows.length).toBe(2);
    expect(component.totalPages).toBe(2);

    component.goTo(2);
    expect(component.visibleRows.length).toBe(1);
  });

  it('emits rowClick only when clickableRows is true', () => {
    const emitted: Row[] = [];
    component.rowClick.subscribe((row) => emitted.push(row));

    component.onRowClick(rows[0]);
    expect(emitted).toEqual([]);

    fixture.componentRef.setInput('clickableRows', true);
    component.onRowClick(rows[0]);
    expect(emitted).toEqual([rows[0]]);
  });
});