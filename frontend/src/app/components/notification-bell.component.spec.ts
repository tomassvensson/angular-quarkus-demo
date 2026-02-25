import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { SocialService } from '../services/social.service';
import { WebSocketNotificationService } from '../services/websocket-notification.service';
import { of } from 'rxjs';
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
});
