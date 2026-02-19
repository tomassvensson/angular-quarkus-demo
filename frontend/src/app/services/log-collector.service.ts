import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LogEntry {
  readonly level: string;
  readonly message: string;
  readonly timestamp: number;
}

/**
 * Collects frontend logs and periodically ships them to the backend
 * log ingestion endpoint, which forwards them to CloudWatch Logs.
 */
@Injectable({ providedIn: 'root' })
export class LogCollectorService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:8080/api/v1/logs'; // NOSONAR
  private readonly buffer: LogEntry[] = [];
  private readonly flushIntervalMs = 10_000; // flush every 10 seconds
  private readonly maxBufferSize = 50;
  private timerId: ReturnType<typeof setInterval> | null = null;

  /**
   * Start collecting logs. Call once during app bootstrap.
   */
  start(): void {
    if (this.timerId !== null) {
      return; // already started
    }
    this.timerId = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  /**
   * Stop collecting logs.
   */
  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.flush();
  }

  log(message: string): void {
    this.addEntry('INFO', message);
  }

  warn(message: string): void {
    this.addEntry('WARN', message);
  }

  error(message: string): void {
    this.addEntry('ERROR', message);
  }

  private addEntry(level: string, message: string): void {
    this.buffer.push({ level, message, timestamp: Date.now() });
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer.length = 0;

    this.http.post(this.endpoint, entries, { withCredentials: true }).subscribe({
      error: (err) => {
        // Don't re-add to buffer to avoid infinite loop; just log to console
        console.error('Failed to ship logs to backend:', err);
      }
    });
  }
}
