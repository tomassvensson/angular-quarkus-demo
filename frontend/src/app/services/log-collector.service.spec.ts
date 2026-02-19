import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LogCollectorService } from './log-collector.service';

const LOGS_URL = 'http://localhost:8080/api/v1/logs'; // NOSONAR — test URL for local dev server

describe('LogCollectorService', () => {
  let service: LogCollectorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        LogCollectorService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(LogCollectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stop();
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not flush when buffer is empty', () => {
    service.start();
    // Manually trigger private flush via stop (which calls flush)
    service.stop();
    httpMock.expectNone(LOGS_URL);
  });

  it('should buffer log entries', () => {
    service.start();
    service.log('info message');
    service.warn('warn message');
    service.error('error message');

    // No immediate HTTP call (buffered)
    httpMock.expectNone(LOGS_URL);

    // Trigger flush via stop
    service.stop();

    const req = httpMock.expectOne(LOGS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.length).toBe(3);
    expect(req.request.body[0].level).toBe('INFO');
    expect(req.request.body[0].message).toBe('info message');
    expect(req.request.body[1].level).toBe('WARN');
    expect(req.request.body[2].level).toBe('ERROR');
    req.flush({});
  });

  it('should flush automatically on interval', () => {
    service.start();
    service.log('timed message');

    // Advance time by 10 seconds (flush interval)
    vi.advanceTimersByTime(10_000);

    const req = httpMock.expectOne(LOGS_URL);
    expect(req.request.body.length).toBe(1);
    expect(req.request.body[0].message).toBe('timed message');
    req.flush({});

    service.stop();
  });

  it('should flush when buffer reaches max size', () => {
    service.start();

    // Add 50 entries (maxBufferSize)
    for (let i = 0; i < 50; i++) {
      service.log(`message ${i}`);
    }

    const req = httpMock.expectOne(LOGS_URL);
    expect(req.request.body.length).toBe(50);
    req.flush({});

    service.stop();
  });

  it('should not start twice', () => {
    service.start();
    service.start(); // second call should be no-op

    service.log('test');
    vi.advanceTimersByTime(10_000);

    // Only one flush should happen
    const req = httpMock.expectOne(LOGS_URL);
    req.flush({});

    service.stop();
  });

  it('should handle flush errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.start();
    service.error('will fail');
    service.stop();

    const req2 = httpMock.expectOne(LOGS_URL);
    req2.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to ship logs to backend:',
      expect.anything()
    );

    consoleSpy.mockRestore();
  });

  it('should not flush after stop when no entries', () => {
    service.start();
    service.stop();
    service.stop(); // double stop should be safe
    httpMock.expectNone(LOGS_URL);
  });
});
