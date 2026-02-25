import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WebSocketNotificationService } from './websocket-notification.service';
import { vi } from 'vitest';

describe('WebSocketNotificationService', () => {
  let service: WebSocketNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WebSocketNotificationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(WebSocketNotificationService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero notification count', () => {
    expect(service.newNotificationCount()).toBe(0);
  });

  it('should start disconnected', () => {
    expect(service.connected()).toBe(false);
  });

  it('should have null lastNotification initially', () => {
    expect(service.lastNotification()).toBeNull();
  });

  it('should reset count', () => {
    // Manually set a value via the signal for testing purposes
    service.newNotificationCount.set(5);
    expect(service.newNotificationCount()).toBe(5);

    service.resetCount();
    expect(service.newNotificationCount()).toBe(0);
  });

  it('should not connect on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WebSocketNotificationService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    const serverService = TestBed.inject(WebSocketNotificationService);

    // Mock WebSocket to verify it is NOT called
    const wsSpy = vi.fn();
    (globalThis as any).WebSocket = wsSpy;

    serverService.connect('test-user');
    expect(wsSpy).not.toHaveBeenCalled();

    serverService.disconnect();
  });

  it('should disconnect cleanly', () => {
    service.disconnect();
    expect(service.connected()).toBe(false);
  });
});
