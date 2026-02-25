import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { SocialService } from '../services/social.service';
import { WebSocketNotificationService } from '../services/websocket-notification.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { signal } from '@angular/core';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let socialServiceMock: any;
  let wsServiceMock: any;

  beforeEach(async () => {
    socialServiceMock = {
      getUnreadCount: vi.fn().mockReturnValue(of(5))
    };
    wsServiceMock = {
      lastNotification: signal(null),
      newNotificationCount: signal(0),
      connected: signal(false),
      connect: vi.fn(),
      disconnect: vi.fn(),
      resetCount: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: SocialService, useValue: socialServiceMock },
        { provide: WebSocketNotificationService, useValue: wsServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display unread count', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('5');
  });

  it('should refresh unread count from social service', () => {
    component.refresh();
    expect(socialServiceMock.getUnreadCount).toHaveBeenCalled();
  });

  it('should display 99+ when unread count exceeds 99', () => {
    component.unreadCount.set(150);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge?.textContent?.trim()).toBe('99+');
  });

  it('should hide badge when unread count is zero', () => {
    component.unreadCount.set(0);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge).toBeFalsy();
  });

  it('should increment count when WebSocket notification arrives', () => {
    component.unreadCount.set(3);

    // Trigger the effect by setting a new notification
    wsServiceMock.lastNotification.set({
      id: '1', type: 'LIKE', entityType: 'post',
      entityId: '1', actorUsername: 'bob', preview: 'liked your post'
    });
    TestBed.flushEffects();

    expect(component.unreadCount()).toBe(4);
  });

  it('should clean up poll interval on destroy', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');

    // ngOnInit sets the interval
    component.ngOnInit();

    // Destroy should clear it
    component.ngOnDestroy();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('should handle error in refresh gracefully', () => {
    socialServiceMock.getUnreadCount.mockReturnValue(throwError(() => new Error('fail')));
    // Should not throw
    expect(() => component.refresh()).not.toThrow();
  });
});
