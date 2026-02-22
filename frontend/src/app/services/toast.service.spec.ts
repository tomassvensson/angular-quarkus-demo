import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts().length).toBe(0);
    expect(service.hasToasts()).toBe(false);
  });

  it('should add a toast via show()', () => {
    service.show('Test message', 'info');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe('info');
    expect(service.hasToasts()).toBe(true);
  });

  it('should add info toast', () => {
    service.info('Info msg');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add success toast', () => {
    service.success('Success msg');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should add warning toast', () => {
    service.warning('Warn msg');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should add error toast', () => {
    service.error('Error msg');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should dismiss a toast by id', () => {
    service.show('Toast 1', 'info');
    service.show('Toast 2', 'error');
    expect(service.toasts().length).toBe(2);

    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Toast 2');
  });

  it('should clear all toasts', () => {
    service.show('T1', 'info');
    service.show('T2', 'error');
    service.clear();
    expect(service.toasts().length).toBe(0);
  });

  it('should limit max toasts to 5', () => {
    for (let i = 0; i < 7; i++) {
      service.show(`Toast ${i}`, 'info');
    }
    expect(service.toasts().length).toBe(5);
    // Should keep the most recent
    expect(service.toasts()[0].message).toBe('Toast 2');
    expect(service.toasts()[4].message).toBe('Toast 6');
  });

  it('should auto-dismiss after timeout', () => {
    service.show('Will disappear', 'info', 1000);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(service.toasts().length).toBe(0);
  });

  it('should use longer timeout for error toasts', () => {
    service.error('Error');
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(6000); // default info timeout
    expect(service.toasts().length).toBe(1); // still there
    vi.advanceTimersByTime(4000); // total 10s for error
    expect(service.toasts().length).toBe(0);
  });
});
