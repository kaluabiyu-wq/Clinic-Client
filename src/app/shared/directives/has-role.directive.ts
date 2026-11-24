import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { StaffRole } from '../../core/models/auth.models';

/**
 * Show an element only to the given roles:
 *   <button *hasRole="['Administrator']">Delete</button>
 *   <a *hasRole="'Clinician'" routerLink="/consultation">My queue</a>
 * Hiding is cosmetic; the API still checks the role on every call.
 */
@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  readonly hasRole = input.required<StaffRole | readonly StaffRole[]>();

  private shown = false;

  constructor() {
    effect(() => {
      const wanted = this.hasRole();
      const roles = (Array.isArray(wanted) ? wanted : [wanted]) as StaffRole[];
      const allowed = this.auth.hasRole(...roles);

      if (allowed && !this.shown) {
        this.container.createEmbeddedView(this.template);
        this.shown = true;
      } else if (!allowed && this.shown) {
        this.container.clear();
        this.shown = false;
      }
    });
  }
}
