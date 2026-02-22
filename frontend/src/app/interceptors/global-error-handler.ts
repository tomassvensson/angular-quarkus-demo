import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { LogCollectorService } from '../services/log-collector.service';

/**
 * Global error handler that catches unhandled exceptions across the application.
 * Displays user-facing toast notifications and ships errors to the log collector.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly logCollector = inject(LogCollectorService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    const message = this.extractMessage(error);

    // Skip auth-related errors (handled by the HTTP interceptor)
    if (message === 'AUTH_REQUIRED') {
      return;
    }

    // Log to console and backend
    console.error('[GlobalErrorHandler]', error);
    this.logCollector.error(`[Unhandled] ${message}`);

    // Show user-facing toast (run inside zone to trigger change detection)
    this.zone.run(() => {
      this.toast.error(this.toUserMessage(message));
    });
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'rejection' in error) {
      return this.extractMessage((error as { rejection: unknown }).rejection);
    }
    return 'An unexpected error occurred';
  }

  private toUserMessage(message: string): string {
    // Translate common technical errors into user-friendly messages
    if (message.includes('Http failure') || message.includes('0 Unknown Error')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('System error') || message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }
    // Cap length for UI display
    if (message.length > 150) {
      return message.substring(0, 147) + '...';
    }
    return message;
  }
}
