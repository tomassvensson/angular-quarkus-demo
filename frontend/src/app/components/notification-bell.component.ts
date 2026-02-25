import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SocialService } from '../services/social.service';
import { WebSocketNotificationService } from '../services/websocket-notification.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a routerLink="/notifications" class="bell-link" [attr.aria-label]="i18n.t('a11y.notifications')">
      <span class="bell-icon" aria-hidden="true">&#128276;</span>
      @if (unreadCount() > 0) {
        <span class="badge" [attr.aria-label]="i18n.t('a11y.unreadNotifications', { count: '' + unreadCount() })">{{ displayCount() }}</span>
      }
    </a>
  `,
  styles: [`
    .bell-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      color: white;
      padding: 0.3rem 0.5rem;
      border: 1px solid rgba(255,255,255,0.45);
      border-radius: 0.55rem;
    }
    .bell-icon { font-size: 1.2rem; }
    .badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 1.1rem;
      height: 1.1rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.25rem;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly socialService = inject(SocialService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly wsService = inject(WebSocketNotificationService);
  protected readonly i18n = inject(I18nService);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  readonly unreadCount = signal(0);

  protected readonly displayCount = computed(() => {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  });

  constructor() {
    // When a WebSocket notification arrives, increment the unread count
    effect(() => {
      const notification = this.wsService.lastNotification();
      if (notification) {
        this.unreadCount.update(c => c + 1);
      }
    });
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refresh();
    // Poll every 60 seconds as fallback (WebSocket handles real-time)
    this.pollInterval = setInterval(() => this.refresh(), 60_000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  refresh(): void {
    this.socialService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => { /* silently ignore if not authenticated */ }
    });
  }
}
