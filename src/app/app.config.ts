import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { TranslateService } from './core/i18n/translate.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Load the saved language (and the English fallback) before the first screen renders.
    provideAppInitializer(() => inject(TranslateService).init()),
    // Confirm a saved session with the API (drops disabled accounts); keeps it if the API is unreachable.
    provideAppInitializer(() => inject(AuthService).restore()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
  ],
};
