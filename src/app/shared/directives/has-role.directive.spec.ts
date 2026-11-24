import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HasRoleDirective } from './has-role.directive';

@Component({
  standalone: true,
  imports: [HasRoleDirective],
  template: `
    <p *hasRole="['Administrator']" id="admin">admin only</p>
    <p *hasRole="'Receptionist'" id="reception">reception</p>
  `,
})
class Host {}

describe('HasRoleDirective', () => {
  async function render(role: string) {
    localStorage.setItem(
      'clinic.session',
      JSON.stringify({
        token: 't',
        expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
        user: { id: '1', fullName: 'X', email: 'x@y.z', role, doctorId: null },
      }),
    );
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => localStorage.removeItem('clinic.session'));

  it('renders only the blocks that match the role', async () => {
    const el = await render('Receptionist');
    expect(el.querySelector('#admin')).toBeNull();
    expect(el.querySelector('#reception')).not.toBeNull();
  });

  it('shows admin blocks to an administrator', async () => {
    const el = await render('Administrator');
    expect(el.querySelector('#admin')).not.toBeNull();
    expect(el.querySelector('#reception')).toBeNull();
  });
});
