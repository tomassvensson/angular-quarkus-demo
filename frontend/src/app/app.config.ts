import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { errorInterceptor } from './interceptors/error.interceptor';
import { GlobalErrorHandler } from './interceptors/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    provideClientHydration(withEventReplay()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
