import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsPageComponent } from './notifications-page.component';
import { SocialService } from '../services/social.service';
import { of, throwError } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

describe('NotificationsPageComponent', () => {
  let component: NotificationsPageComponent;
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let socialServiceMock: any;
  let router: Router;

  const mockNotifications = {
    items: [
      {
        id: 'n1',
        userId: 'me',
        type: 'COMMENT',
        entityType: 'LIST',
        entityId: 'list1',
        actorUsername: 'user1',
        preview: 'Great list!',
        read: false,
        targetId: 'c1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'n2',
        userId: 'me',
        type: 'REPLY',
        entityType: 'LIST',
        entityId: 'list1',
        actorUsername: 'user2',
        preview: 'I agree!',
        read: true,
        targetId: 'r1',
        createdAt: new Date().toISOString()
      }
    ],
    total: 2,
    unreadCount: 1
  };

  beforeEach(async () => {
    socialServiceMock = {
      getNotifications: vi.fn().mockReturnValue(of(mockNotifications)),
      markNotificationRead: vi.fn().mockReturnValue(of(true)),
      markAllNotificationsRead: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsPageComponent],
      providers: [
        provideRouter([]),
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    expect(socialServiceMock.getNotifications).toHaveBeenCalled();
    expect(component.notifications().length).toBe(2);
  });

  it('should display unread count', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1 unread');
  });

  it('should show unread notification as bold', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.notification-item');
    expect(items.length).toBe(2);
    // First should be unread
    expect(items[0].classList.contains('unread')).toBe(true);
  });

  it('should mark notification as read on click', () => {
    component['onNotificationClick'](mockNotifications.items[0] as any);
    expect(socialServiceMock.markNotificationRead).toHaveBeenCalledWith('n1');
  });

  it('should mark all as read', () => {
    component['markAllRead']();
    expect(socialServiceMock.markAllNotificationsRead).toHaveBeenCalled();
  });

  it('should update notifications and unreadCount after mark all read', () => {
    component['markAllRead']();
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBe(true);
  });

  it('should update notification to read and decrement unread count on click', () => {
    component['onNotificationClick'](mockNotifications.items[0] as any);
    expect(component.unreadCount()).toBe(0);
    expect(component.notifications()[0].read).toBe(true);
  });

  it('should not call markNotificationRead for already read notification', () => {
    component['onNotificationClick'](mockNotifications.items[1] as any);
    expect(socialServiceMock.markNotificationRead).not.toHaveBeenCalled();
  });

  it('should navigate to list detail on LIST entity click', () => {
    component['onNotificationClick'](mockNotifications.items[0] as any);
    expect(router.navigate).toHaveBeenCalledWith(['/lists', 'list1']);
  });

  it('should navigate to public-lists on LINK entity click', () => {
    const linkNotification = { ...mockNotifications.items[0], entityType: 'LINK' } as any;
    component['onNotificationClick'](linkNotification);
    expect(router.navigate).toHaveBeenCalledWith(['/public-lists']);
  });

  it('should go to previous page', () => {
    component.page.set(1);
    component['previousPage']();
    expect(component.page()).toBe(0);
    expect(socialServiceMock.getNotifications).toHaveBeenCalledTimes(2);
  });

  it('should not go below page 0', () => {
    component.page.set(0);
    component['previousPage']();
    expect(component.page()).toBe(0);
    // No extra call beyond initial
    expect(socialServiceMock.getNotifications).toHaveBeenCalledTimes(1);
  });

  it('should go to next page when more pages exist', () => {
    // Set total > pageSize to allow next page
    socialServiceMock.getNotifications.mockReturnValue(of({ items: [], total: 40, unreadCount: 0 }));
    component['loadPage']();
    fixture.detectChanges();
    component['nextPage']();
    expect(component.page()).toBe(1);
  });

  it('should not go past last page', () => {
    component.total.set(2);
    component.page.set(0);
    component['nextPage']();
    expect(component.page()).toBe(0);
  });

  it('should truncate long text', () => {
    expect(component['truncate']('Hello World!', 5)).toBe('Hello...');
  });

  it('should not truncate short text', () => {
    expect(component['truncate']('Hi', 10)).toBe('Hi');
  });

  it('should return empty string for empty text in truncate', () => {
    expect(component['truncate']('', 10)).toBe('');
  });

  it('should return correct aria label for unread comment', () => {
    const label = component['notificationAriaLabel'](mockNotifications.items[0] as any);
    expect(label).toContain('Unread');
    expect(label).toContain('commented');
    expect(label).toContain('user1');
  });

  it('should return correct aria label for read reply', () => {
    const label = component['notificationAriaLabel'](mockNotifications.items[1] as any);
    expect(label).toContain('Read');
    expect(label).toContain('replied');
    expect(label).toContain('user2');
  });

  it('should handle loadPage error', () => {
    socialServiceMock.getNotifications.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component['loadPage']();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should show empty state when no notifications', () => {
    socialServiceMock.getNotifications.mockReturnValue(of({ items: [], total: 0, unreadCount: 0 }));
    component['loadPage']();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No notifications');
  });
});
