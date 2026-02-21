import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SocialService } from '../services/social.service';
import { Notification } from '../models';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">{{ i18n.t('notifications.title') }}</h1>
        <div class="flex items-center gap-4">
          @if (unreadCount() > 0) {
            <span class="text-sm text-gray-600">{{ unreadCount() }} {{ i18n.t('notifications.unread') }}</span>
            <button (click)="markAllRead()" class="text-sm text-blue-600 hover:underline cursor-pointer">
              {{ i18n.t('notifications.markAllRead') }}
            </button>
          }
        </div>
      </div>

      @for (notification of notifications(); track notification.id) {
        <div
          class="notification-item"
          [class.unread]="!notification.read"
          (click)="onNotificationClick(notification)"
          (keyup.enter)="onNotificationClick(notification)"
          role="button"
          tabindex="0"
          [attr.aria-label]="notificationAriaLabel(notification)">
          <div class="notification-header">
            <span class="notification-actor" [class.font-bold]="!notification.read">
              {{ notification.actorUsername }}
            </span>
            <span class="notification-type">
              {{ notification.type === 'COMMENT' ? i18n.t('notifications.commentedOn') : i18n.t('notifications.repliedOn') }}
            </span>
            <span class="notification-entity">
              {{ notification.entityType === 'LIST' ? i18n.t('notifications.aList') : i18n.t('notifications.aLink') }}
            </span>
          </div>
          <div class="notification-preview" [class.font-bold]="!notification.read">
            {{ truncate(notification.preview, 80) }}
          </div>
          <div class="notification-date">
            {{ notification.createdAt | date:'medium' }}
          </div>
        </div>
      } @empty {
        <p style="color: var(--color-text-muted)">{{ i18n.t('notifications.noNotifications') }}</p>
      }

      @if (totalPages() > 1) {
        <nav class="mt-6 flex items-center justify-center gap-4" aria-label="Notification pagination">
          <button
            (click)="previousPage()"
            [disabled]="page() === 0"
            class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
            Previous
          </button>
          <span class="text-sm text-gray-600">
            {{ i18n.t('publicLists.page') }} {{ page() + 1 }} {{ i18n.t('publicLists.of') }} {{ totalPages() }}
          </span>
          <button
            (click)="nextPage()"
            [disabled]="page() >= totalPages() - 1"
            class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
            Next
          </button>
        </nav>
      }
    </div>
  `,
  styles: [`
    .notification-item {
      border: 1px solid var(--color-card-border);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: background 0.15s;
      background: var(--color-card-bg);
    }
    .notification-item:hover { background: var(--color-row-hover); }
    .notification-item.unread {
      background: var(--color-row-even);
      border-left: 3px solid var(--color-link);
    }
    .notification-header {
      display: flex;
      gap: 0.3rem;
      font-size: 0.9rem;
      color: var(--color-text);
      flex-wrap: wrap;
    }
    .notification-actor { color: var(--color-link); }
    .notification-type { color: var(--color-text-muted); }
    .notification-entity { color: var(--color-text-muted); }
    .notification-preview {
      margin-top: 0.25rem;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notification-date {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
  `]
})
export class NotificationsPageComponent implements OnInit {
  private readonly socialService = inject(SocialService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  readonly notifications = signal<Notification[]>([]);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly unreadCount = signal(0);
  private readonly pageSize = 20;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  ngOnInit() {
    this.loadPage();
  }

  protected onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.read) {
      this.socialService.markNotificationRead(notification.id).subscribe(() => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      });
    }

    // Navigate to the entity
    if (notification.entityType === 'LIST') {
      this.router.navigate(['/lists', notification.entityId]);
    } else if (notification.entityType === 'LINK') {
      // Links don't have their own page; navigate to a relevant list
      this.router.navigate(['/public-lists']);
    }
  }

  protected markAllRead(): void {
    this.socialService.markAllNotificationsRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  protected previousPage(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadPage();
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() - 1) {
      this.page.set(this.page() + 1);
      this.loadPage();
    }
  }

  protected truncate(text: string, maxLen: number): string {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  }

  protected notificationAriaLabel(n: Notification): string {
    const readStatus = n.read ? 'Read' : 'Unread';
    return `${readStatus}: ${n.actorUsername} ${n.type === 'COMMENT' ? 'commented' : 'replied'}: ${this.truncate(n.preview, 50)}`;
  }

  private loadPage(): void {
    this.socialService.getNotifications(this.page(), this.pageSize).subscribe({
      next: (data) => {
        this.notifications.set(data.items);
        this.total.set(data.total);
        this.unreadCount.set(data.unreadCount);
      },
      error: (err: Error) => console.error('Failed to load notifications:', err.message)
    });
  }
}
