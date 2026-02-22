import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../services/toast.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toastService.hasToasts()) {
      <div class="toast-container" role="status" aria-live="polite">
        @for (toast of toastService.toasts(); track toast.id) {
          <div [class]="'toast toast-' + toast.type" role="alert">
            <span class="toast-icon">{{ iconFor(toast.type) }}</span>
            <span class="toast-message">{{ toast.message }}</span>
            <button class="toast-close" (click)="toastService.dismiss(toast.id)"
                    [attr.aria-label]="i18n.t('a11y.dismissNotification')">&times;</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .toast-info {
      background: var(--toast-info-bg, #e0f2fe);
      color: var(--toast-info-text, #0c4a6e);
      border-left: 4px solid #0ea5e9;
    }
    .toast-success {
      background: var(--toast-success-bg, #dcfce7);
      color: var(--toast-success-text, #14532d);
      border-left: 4px solid #22c55e;
    }
    .toast-warning {
      background: var(--toast-warning-bg, #fef3c7);
      color: var(--toast-warning-text, #78350f);
      border-left: 4px solid #f59e0b;
    }
    .toast-error {
      background: var(--toast-error-bg, #fee2e2);
      color: var(--toast-error-text, #7f1d1d);
      border-left: 4px solid #ef4444;
    }
    .toast-icon { font-size: 1.1rem; flex-shrink: 0; }
    .toast-message { flex: 1; }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.6;
      padding: 0 0.25rem;
      line-height: 1;
      color: inherit;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    :host-context([data-theme='dark']) .toast-info {
      background: #0c4a6e; color: #e0f2fe;
    }
    :host-context([data-theme='dark']) .toast-success {
      background: #14532d; color: #dcfce7;
    }
    :host-context([data-theme='dark']) .toast-warning {
      background: #78350f; color: #fef3c7;
    }
    :host-context([data-theme='dark']) .toast-error {
      background: #7f1d1d; color: #fee2e2;
    }
  `]
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  iconFor(type: ToastType): string {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
    }
  }
}
