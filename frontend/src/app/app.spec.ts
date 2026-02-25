import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let httpMock: HttpTestingController;
  let originalWs: typeof WebSocket;

  beforeEach(async () => {
    // Mock WebSocket so tests don't create real connections
    originalWs = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = function MockWebSocket(this: any) {
      this.onopen = null;
      this.onclose = null;
      this.onmessage = null;
      this.onerror = null;
      this.close = () => {};
      this.readyState = 1;
    };

    // Mock matchMedia for ThemeService
    if (!globalThis.matchMedia) {
      globalThis.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
    }

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (globalThis as any).WebSocket = originalWs;
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const reqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    reqs.forEach(r => {
      if (r.request.body?.query?.includes('me')) {
        r.flush({
          data: {
            me: {
              username: 'demo@example.com',
              email: 'demo@example.com',
              roles: ['RegularUser']
            }
          }
        });
      } else {
        r.flush({ data: { unreadNotificationCount: 0 } });
      }
    });

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render app title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Flush initial requests (me query)
    const reqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    reqs.forEach(r => {
      if (r.request.body?.query?.includes('me')) {
        r.flush({
          data: {
            me: {
              username: 'admin@example.com',
              email: 'admin@example.com',
              roles: ['AdminUser']
            }
          }
        });
      } else {
        r.flush({ data: { unreadNotificationCount: 0 } });
      }
    });

    // After flushing me, isSignedIn becomes true -> notification bell renders and fires request
    fixture.detectChanges();
    const bellReqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    bellReqs.forEach(r => r.flush({ data: { unreadNotificationCount: 0 } }));

    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Angular + Quarkus Cognito Demo');
  });

  it('should handle AUTH_REQUIRED error on reloadMe', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Flush initial request as auth failure
    const reqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    reqs.forEach(r => {
      r.flush(JSON.stringify({ errors: [{ message: 'Not signed in' }] }));
    });

    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app['me']()).toBeNull();
    expect(app['loading']()).toBe(false);
  });

  it('should show admin nav when user has AdminUser role', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const reqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    reqs.forEach(r => {
      if (r.request.body?.query?.includes('me')) {
        r.flush({
          data: {
            me: { username: 'admin', email: 'admin@test.com', roles: ['AdminUser'] }
          }
        });
      } else {
        r.flush({ data: { unreadNotificationCount: 0 } });
      }
    });

    fixture.detectChanges();
    expect(fixture.componentInstance['isAdmin']()).toBe(true);

    // Flush any trailing requests
    const trailing = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    trailing.forEach(r => r.flush({ data: { unreadNotificationCount: 0 } }));
  });

  it('should clean up on destroy', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Flush initial requests
    const reqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    reqs.forEach(r => {
      if (r.request.body?.query?.includes('me')) {
        r.flush({
          data: {
            me: { username: 'user', email: 'user@test.com', roles: ['user'] }
          }
        });
      } else {
        r.flush({ data: { unreadNotificationCount: 0 } });
      }
    });

    // Flush notification bell requests
    fixture.detectChanges();
    const bellReqs = httpMock.match('http://localhost:8080/api/v1/graphql'); // NOSONAR
    bellReqs.forEach(r => r.flush({ data: { unreadNotificationCount: 0 } }));

    // Destroy should not throw
    expect(() => fixture.destroy()).not.toThrow();
  });
});
