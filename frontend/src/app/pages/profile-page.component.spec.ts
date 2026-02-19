import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePageComponent } from './profile-page.component';
import { GraphqlApiService } from '../services/graphql-api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;
  let apiSpy: any;
  let routerSpy: any;

  const mockMe = { username: 'alice', email: 'alice@example.com', roles: ['user'] };
  const mockUser = {
    username: 'alice',
    email: 'alice@example.com',
    emailVerified: true,
    confirmationStatus: 'CONFIRMED',
    status: 'enabled',
    enabled: true,
    created: '2023-01-01',
    lastUpdatedTime: '2023-01-01',
    modified: '2023-01-01',
    mfaSetting: 'OFF',
    groups: ['user']
  };

  beforeEach(async () => {
    apiSpy = {
      me: vi.fn(),
      user: vi.fn(),
      deleteUser: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    apiSpy.me.mockReturnValue(of(mockMe));
    apiSpy.user.mockReturnValue(of(mockUser));
    apiSpy.deleteUser.mockReturnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        { provide: GraphqlApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user details on init', () => {
    expect(apiSpy.me).toHaveBeenCalled();
    expect(apiSpy.user).toHaveBeenCalledWith('alice');
    expect(component.user()?.username).toBe('alice');
  });

  it('should call deleteUser and redirect on delete action', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    // Mock global location
    const originalLocation = globalThis.location;
    delete (globalThis as any).location;
    (globalThis as any).location = { href: '' };

    component.deleteAccount();

    expect(apiSpy.deleteUser).toHaveBeenCalledWith('alice');
    expect(globalThis.location.href).toContain('logout');

    (globalThis as any).location = originalLocation;
  });

  it('should not delete if confirmation declined', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    component.deleteAccount();
    expect(apiSpy.deleteUser).not.toHaveBeenCalled();
  });

  it('should show error when me() fails with non-auth error', () => {
    apiSpy.me.mockReturnValue(throwError(() => new Error('Network error')));

    component.load();
    fixture.detectChanges();

    expect(component.error()).toBe('Network error');
  });

  it('should redirect on AUTH_REQUIRED', () => {
    apiSpy.me.mockReturnValue(throwError(() => new Error('AUTH_REQUIRED')));

    component.load();
    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should fallback to me info when user details fail', () => {
    apiSpy.user.mockReturnValue(throwError(() => new Error('User not found')));

    component.load();
    fixture.detectChanges();

    // Should still set user from me fallback
    expect(component.user()).toBeTruthy();
    expect(component.user()?.username).toBe('alice');
    expect(component.loading()).toBe(false);
  });

  it('should show user data after load', () => {
    expect(component.loading()).toBe(false); // loaded already from beforeEach
    const usernameInput = fixture.nativeElement.querySelector('#username') as HTMLInputElement;
    expect(usernameInput.value).toBe('alice');
    const emailInput = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    expect(emailInput.value).toBe('alice@example.com');
  });

  it('should handle deleteAccount error', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    apiSpy.deleteUser.mockReturnValue(throwError(() => new Error('Delete failed')));

    component.deleteAccount();
    fixture.detectChanges();

    expect(component.error()).toBe('Delete failed');
  });
});
