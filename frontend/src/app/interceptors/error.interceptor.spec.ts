import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { LogCollectorService } from '../services/log-collector.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: LogCollectorService, useValue: { log: vi.fn(), warn: vi.fn(), error: vi.fn() } }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful requests', () => {
    http.get('/api/test').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    httpMock.expectOne('/api/test').flush({ ok: true });
  });

  it('should transform 401 into AUTH_REQUIRED error', () => {
    http.get('/api/test').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('AUTH_REQUIRED');
      }
    });

    httpMock.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should transform 403 into AUTH_REQUIRED error', () => {
    http.get('/api/test').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('AUTH_REQUIRED');
      }
    });

    httpMock.expectOne('/api/test').flush(null, { status: 403, statusText: 'Forbidden' });
  });

  it('should pass through other HTTP errors unchanged', () => {
    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
      }
    });

    httpMock.expectOne('/api/test').flush(null, { status: 500, statusText: 'Server Error' });
  });

  it('should skip intercepting log ingestion requests', () => {
    http.post('/api/v1/logs', [{ level: 'INFO', message: 'test' }]).subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    httpMock.expectOne('/api/v1/logs').flush({ ok: true });
  });

  it('should handle network errors (status 0)', () => {
    http.get('/api/data').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(0);
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.error(new ProgressEvent('error'));
  });
});
