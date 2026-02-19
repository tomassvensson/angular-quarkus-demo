import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LogCollectorService } from '../services/log-collector.service';

/**
 * Global HTTP error interceptor that logs errors and transforms
 * authentication failures into consistent AUTH_REQUIRED errors.
 * Skips intercepting requests to the log ingestion endpoint to avoid infinite loops.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip log ingestion requests to prevent circular logging
  if (req.url.includes('/api/v1/logs')) {
    return next(req);
  }

  const logCollector = inject(LogCollectorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.warn(`[HTTP ${error.status}] Auth error on ${req.method} ${req.url}`);
        logCollector.warn(`[HTTP ${error.status}] Auth error on ${req.method} ${req.url}`);
        return throwError(() => new Error('AUTH_REQUIRED'));
      }

      if (error.status === 0) {
        console.error(`[HTTP] Network error on ${req.method} ${req.url}`, error.message);
        logCollector.error(`[HTTP] Network error on ${req.method} ${req.url}: ${error.message}`);
      } else {
        console.error(`[HTTP ${error.status}] ${req.method} ${req.url}`, error.message);
        logCollector.error(`[HTTP ${error.status}] ${req.method} ${req.url}: ${error.message}`);
      }

      return throwError(() => error);
    })
  );
};
