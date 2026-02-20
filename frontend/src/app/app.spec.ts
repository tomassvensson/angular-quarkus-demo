import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
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
});
