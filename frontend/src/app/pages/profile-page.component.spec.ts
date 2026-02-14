import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePageComponent } from './profile-page.component';
import { GraphqlApiService } from '../services/graphql-api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;
  let apiSpy: jasmine.SpyObj<GraphqlApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

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
    apiSpy = jasmine.createSpyObj('GraphqlApiService', ['me', 'user', 'deleteUser']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    apiSpy.me.and.returnValue(of(mockMe));
    apiSpy.user.and.returnValue(of(mockUser));
    apiSpy.deleteUser.and.returnValue(of(true));

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
    spyOn(window, 'confirm').and.returnValue(true);
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
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteAccount();
    expect(apiSpy.deleteUser).not.toHaveBeenCalled();
  });
});
