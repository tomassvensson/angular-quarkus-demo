import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandler } from './global-error-handler';
import { ToastService } from '../services/toast.service';
import { LogCollectorService } from '../services/log-collector.service';
import { provideHttpClient } from '@angular/common/http';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let toastService: ToastService;
  let logCollector: LogCollectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        provideHttpClient()
      ]
    });
    handler = TestBed.inject(GlobalErrorHandler);
    toastService = TestBed.inject(ToastService);
    logCollector = TestBed.inject(LogCollectorService);
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('should show error toast for Error instances', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError(new Error('Something broke'));
    expect(spy).toHaveBeenCalledWith('Something broke');
  });

  it('should show error toast for string errors', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError('String error');
    expect(spy).toHaveBeenCalledWith('String error');
  });

  it('should skip AUTH_REQUIRED errors', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError(new Error('AUTH_REQUIRED'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should log to LogCollectorService', () => {
    const logSpy = vi.spyOn(logCollector, 'error');
    handler.handleError(new Error('Test error'));
    expect(logSpy).toHaveBeenCalled();
  });

  it('should translate network errors into user-friendly message', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError(new Error('Http failure response for http://localhost:8080/api: 0 Unknown Error'));
    expect(spy).toHaveBeenCalledWith('Network error. Please check your connection.');
  });

  it('should translate server errors into user-friendly message', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError(new Error('System error'));
    expect(spy).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('should handle unknown error types', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError(42);
    expect(spy).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('should truncate long error messages', () => {
    const spy = vi.spyOn(toastService, 'error');
    const longMessage = 'A'.repeat(200);
    handler.handleError(new Error(longMessage));
    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    expect(callArg.length).toBeLessThanOrEqual(150);
    expect(callArg.endsWith('...')).toBe(true);
  });

  it('should handle rejection errors', () => {
    const spy = vi.spyOn(toastService, 'error');
    handler.handleError({ rejection: new Error('Promise rejected') });
    expect(spy).toHaveBeenCalledWith('Promise rejected');
  });
});
