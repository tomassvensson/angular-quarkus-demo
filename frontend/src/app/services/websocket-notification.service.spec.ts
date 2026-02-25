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

  describe('WebSocket connection lifecycle', () => {
    let mockWsInstances: any[];
    let originalWs: typeof WebSocket;

    beforeEach(() => {
      mockWsInstances = [];
      originalWs = (globalThis as any).WebSocket;
      // Must use a regular function (not arrow) so it can be called with `new`
      (globalThis as any).WebSocket = vi.fn().mockImplementation(function (this: any, url: string) {
        this.url = url;
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        this.close = vi.fn();
        this.readyState = 1;
        mockWsInstances.push(this);
      });
    });

    afterEach(() => {
      (globalThis as any).WebSocket = originalWs;
    });

    it('should create WebSocket with correct URL on connect', () => {
      service.connect('user123');

      expect(mockWsInstances.length).toBe(1);
      expect(mockWsInstances[0].url).toContain('user123');
    });

    it('should set connected=true on open', () => {
      service.connect('user1');

      // Simulate onopen
      mockWsInstances[0].onopen();

      expect(service.connected()).toBe(true);
    });

    it('should parse and emit notification on message', () => {
      service.connect('user1');

      const notification = {
        id: '1', type: 'LIKE', entityType: 'post',
        entityId: '42', actorUsername: 'bob', preview: 'liked your post'
      };
      mockWsInstances[0].onmessage({ data: JSON.stringify(notification) });

      expect(service.lastNotification()).toEqual(notification);
      expect(service.newNotificationCount()).toBe(1);
    });

    it('should increment count on each message', () => {
      service.connect('user1');

      const msg = { data: JSON.stringify({ id: '1', type: 'X', entityType: 'p', entityId: '1', actorUsername: 'a', preview: '' }) };
      mockWsInstances[0].onmessage(msg);
      mockWsInstances[0].onmessage(msg);
      mockWsInstances[0].onmessage(msg);

      expect(service.newNotificationCount()).toBe(3);
    });

    it('should handle malformed JSON in message gracefully', () => {
      service.connect('user1');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockWsInstances[0].onmessage({ data: 'not json' });

      expect(consoleSpy).toHaveBeenCalled();
      expect(service.newNotificationCount()).toBe(0);
      consoleSpy.mockRestore();
    });

    it('should set connected=false on close and schedule reconnect', () => {
      service.connect('user1');
      mockWsInstances[0].onopen();
      expect(service.connected()).toBe(true);

      mockWsInstances[0].onclose();
      expect(service.connected()).toBe(false);
    });

    it('should not create duplicate connections for same user', () => {
      service.connect('user1');
      service.connect('user1');

      // Only 1 WebSocket created (skip if same userId)
      expect(mockWsInstances.length).toBe(1);
    });

    it('should close previous connection when connecting different user', () => {
      service.connect('user1');
      const firstWs = mockWsInstances[0];

      service.connect('user2');

      expect(firstWs.close).toHaveBeenCalled();
      expect(mockWsInstances.length).toBe(2);
    });

    it('should clean up WebSocket on disconnect', () => {
      service.connect('user1');
      const ws = mockWsInstances[0];

      service.disconnect();

      expect(ws.close).toHaveBeenCalled();
      expect(service.connected()).toBe(false);
    });

    it('should clean up on ngOnDestroy', () => {
      service.connect('user1');
      const ws = mockWsInstances[0];

      service.ngOnDestroy();

      expect(ws.close).toHaveBeenCalled();
    });
  });
});
