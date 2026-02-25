import { Injectable, inject, signal, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface WebSocketNotification {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  actorUsername: string;
  preview: string;
}

/**
 * Service that manages a WebSocket connection for real-time notification delivery.
 * Replaces polling with push-based updates for the notification bell.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketNotificationService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30_000;
  private userId: string | null = null;

  /** Emits the count of new notifications received via WebSocket since last reset */
  readonly newNotificationCount = signal(0);

  /** Emits when any WebSocket notification is received */
  readonly lastNotification = signal<WebSocketNotification | null>(null);

  /** Whether the WebSocket is currently connected */
  readonly connected = signal(false);

  connect(userId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket && this.userId === userId) return;

    this.userId = userId;
    this.disconnect();
    this.doConnect();
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnect on intentional close
      this.socket.close();
      this.socket = null;
    }
    this.connected.set(false);
  }

  resetCount(): void {
    this.newNotificationCount.set(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private doConnect(): void {
    if (!this.userId) return;

    const wsUrl = `ws://localhost:8080/ws/notifications?userId=${encodeURIComponent(this.userId)}`; // NOSONAR
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data as string) as WebSocketNotification;
        this.lastNotification.set(notification);
        this.newNotificationCount.update(count => count + 1);
      } catch (err) {
        console.error('Failed to parse WebSocket notification:', err);
      }
    };

    this.socket.onclose = () => {
      this.connected.set(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      // onerror is always followed by onclose, so reconnect happens there
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, delay);
  }
}
