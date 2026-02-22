import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
  readonly timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly maxToasts = 5;
  private readonly defaultDurationMs = 6000;

  readonly toasts = signal<Toast[]>([]);
  readonly hasToasts = computed(() => this.toasts().length > 0);

  show(message: string, type: ToastType = 'info', durationMs?: number): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, timestamp: Date.now() };

    this.toasts.update(current => {
      const updated = [...current, toast];
      // Keep only the most recent toasts
      return updated.length > this.maxToasts ? updated.slice(-this.maxToasts) : updated;
    });

    const duration = durationMs ?? (type === 'error' ? 10_000 : this.defaultDurationMs);
    setTimeout(() => this.dismiss(id), duration);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
