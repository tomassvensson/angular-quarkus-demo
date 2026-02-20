import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsPageComponent } from './notifications-page.component';
import { SocialService } from '../services/social.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

describe('NotificationsPageComponent', () => {
  let component: NotificationsPageComponent;
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let socialServiceMock: any;

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
});
