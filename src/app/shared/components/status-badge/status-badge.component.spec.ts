import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  function render(status: string | null | undefined, label = ''): HTMLElement {
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.status-badge');
  }

  it('shows the label for a known status', () => {
    const badge = render('Waiting');
    expect(badge.textContent).toContain('Waiting');
    expect(badge.classList).toContain('status-badge--waiting');
  });

  it('normalises casing and punctuation for No-show', () => {
    expect(component.key).toBe('unknown');

    const badge = render('No-show');
    expect(badge.textContent).toContain('No-show');
    expect(badge.classList).toContain('status-badge--noshow');

    const badge2 = render('NoShow');
    expect(badge2.classList).toContain('status-badge--noshow');
  });

  it('maps every lifecycle status to its own class', () => {
    const statuses = ['Booked', 'Waiting', 'Serving', 'Completed', 'Cancelled', 'No-show'];
    const classes = statuses.map((s) => {
      const badge = render(s);
      return Array.from(badge.classList).find((c) => c.startsWith('status-badge--'));
    });
    expect(new Set(classes).size).toBe(statuses.length);
  });

  it('falls back to Unknown for empty or unrecognised values', () => {
    expect(render('').textContent).toContain('Unknown');
    expect(render(null).textContent).toContain('Unknown');
    expect(render('Archived').classList).toContain('status-badge--unknown');
  });

  it('uses a custom label when provided', () => {
    const badge = render('Booked', 'Scheduled');
    expect(badge.textContent).toContain('Scheduled');
    expect(badge.textContent).not.toContain('Booked');
  });
});