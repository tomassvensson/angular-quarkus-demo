import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
      deleteUser: vi.fn(),
      changePassword: vi.fn(),
      trustedDevices: vi.fn(),
      forgetDevice: vi.fn(),
      setupTotp: vi.fn(),
      verifyTotp: vi.fn(),
      setMfaPreference: vi.fn(),
      getProfilePictureInfo: vi.fn(),
      getProfilePictureUploadUrl: vi.fn(),
      confirmProfilePictureUpload: vi.fn(),
      deleteProfilePicture: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    apiSpy.me.mockReturnValue(of(mockMe));
    apiSpy.user.mockReturnValue(of(mockUser));
    apiSpy.deleteUser.mockReturnValue(of(true));
    apiSpy.changePassword.mockReturnValue(of(true));
    apiSpy.trustedDevices.mockReturnValue(of([]));
    apiSpy.forgetDevice.mockReturnValue(of(true));
    apiSpy.setupTotp.mockReturnValue(of({ secretCode: 'ABCDEF', qrCodeUri: 'otpauth://totp/test' }));
    apiSpy.verifyTotp.mockReturnValue(of(true));
    apiSpy.setMfaPreference.mockReturnValue(of(true));
    apiSpy.getProfilePictureInfo.mockReturnValue(of({ url: 'https://gravatar.com/avatar/test', source: 'gravatar', uploadEnabled: true }));
    apiSpy.getProfilePictureUploadUrl.mockReturnValue(of({ uploadUrl: 'https://s3.example.com/upload' }));
    apiSpy.confirmProfilePictureUpload.mockReturnValue(of({ status: 'confirmed' }));
    apiSpy.deleteProfilePicture.mockReturnValue(of({ status: 'deleted' }));

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  // Password change tests
  it('should show password change form', () => {
    const form = fixture.nativeElement.querySelector('.password-form');
    expect(form).toBeTruthy();
    const currentPasswordInput = fixture.nativeElement.querySelector('#currentPassword') as HTMLInputElement;
    const newPasswordInput = fixture.nativeElement.querySelector('#newPassword') as HTMLInputElement;
    const confirmPasswordInput = fixture.nativeElement.querySelector('#confirmPassword') as HTMLInputElement;
    expect(currentPasswordInput).toBeTruthy();
    expect(newPasswordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('should show error when passwords do not match', () => {
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmPassword: 'Different!'
    });

    component.submitPasswordChange();
    fixture.detectChanges();

    expect(component.passwordError()).toContain('match');
    expect(apiSpy.changePassword).not.toHaveBeenCalled();
  });

  it('should show error when fields are empty', () => {
    component.passwordForm.setValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    component.submitPasswordChange();
    fixture.detectChanges();

    expect(component.passwordError()).toBeTruthy();
    expect(apiSpy.changePassword).not.toHaveBeenCalled();
  });

  it('should call changePassword API on valid submit', () => {
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!'
    });

    component.submitPasswordChange();
    fixture.detectChanges();

    expect(apiSpy.changePassword).toHaveBeenCalledWith('OldPass1!', 'NewPass1!');
    expect(component.passwordSuccess()).toBe(true);
    expect(component.passwordError()).toBe('');
  });

  it('should show error when changePassword API fails', () => {
    apiSpy.changePassword.mockReturnValue(throwError(() => new Error('Current password is incorrect')));

    component.passwordForm.setValue({
      currentPassword: 'WrongPass!',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!'
    });

    component.submitPasswordChange();
    fixture.detectChanges();

    expect(component.passwordError()).toContain('Current password is incorrect');
    expect(component.passwordSuccess()).toBe(false);
  });

  it('should reset form after successful password change', () => {
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!'
    });

    component.submitPasswordChange();
    fixture.detectChanges();

    expect(component.passwordForm.value.currentPassword).toBeFalsy();
    expect(component.passwordForm.value.newPassword).toBeFalsy();
    expect(component.passwordForm.value.confirmPassword).toBeFalsy();
  });

  it('should disable submit button while changing password', () => {
    component.changingPassword.set(true);
    fixture.detectChanges();

    const passwordSection = fixture.nativeElement.querySelector('.password-section');
    const submitBtn = passwordSection?.querySelector('.btn-primary') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  // MFA tests
  it('should show MFA section with title', () => {
    const mfaSection = fixture.nativeElement.querySelector('.mfa-section');
    expect(mfaSection).toBeTruthy();
    const heading = mfaSection.querySelector('h3');
    expect(heading.textContent).toContain('Multi-Factor Authentication');
  });

  it('should show no devices message when no trusted devices', () => {
    fixture.detectChanges();
    const mfaSection = fixture.nativeElement.querySelector('.mfa-section');
    expect(mfaSection.textContent).toContain('No trusted devices found');
  });

  it('should display trusted devices list', () => {
    const devices = [
      { deviceKey: 'dk1', deviceName: 'My Phone', lastAuthenticatedDate: '2024-01-01', createdDate: '2024-01-01', lastModifiedDate: '2024-01-01' },
      { deviceKey: 'dk2', deviceName: 'My Laptop', lastAuthenticatedDate: '2024-01-02', createdDate: '2024-01-01', lastModifiedDate: '2024-01-02' }
    ];
    apiSpy.trustedDevices.mockReturnValue(of(devices));
    component.loadTrustedDevices();
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.device-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('My Phone');
    expect(items[1].textContent).toContain('My Laptop');
  });

  it('should call forgetDevice when removing a device', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const device = { deviceKey: 'dk1', deviceName: 'My Phone', lastAuthenticatedDate: '', createdDate: '', lastModifiedDate: '' };
    component.trustedDevices.set([device]);
    fixture.detectChanges();

    component.removeDevice(device);
    expect(apiSpy.forgetDevice).toHaveBeenCalledWith('dk1');
  });

  it('should not call forgetDevice when removal is cancelled', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const device = { deviceKey: 'dk1', deviceName: 'My Phone', lastAuthenticatedDate: '', createdDate: '', lastModifiedDate: '' };

    component.removeDevice(device);
    expect(apiSpy.forgetDevice).not.toHaveBeenCalled();
  });

  it('should call setupTotp and show secret code', () => {
    component.startTotpSetup();
    fixture.detectChanges();

    expect(apiSpy.setupTotp).toHaveBeenCalled();
    expect(component.totpSetup()?.secretCode).toBe('ABCDEF');

    const secretCode = fixture.nativeElement.querySelector('.secret-code');
    expect(secretCode?.textContent).toContain('ABCDEF');
  });

  it('should verify TOTP code successfully', () => {
    component.totpSetup.set({ secretCode: 'ABC', qrCodeUri: '' });
    component.totpVerifyForm.setValue({ totpCode: '123456' });

    component.submitTotpVerify();
    fixture.detectChanges();

    expect(apiSpy.verifyTotp).toHaveBeenCalledWith('123456');
    expect(component.totpVerified()).toBe(true);
    expect(component.totpSetup()).toBeNull();
  });

  it('should show error when TOTP verification fails', () => {
    apiSpy.verifyTotp.mockReturnValue(throwError(() => new Error('Invalid code')));
    component.totpSetup.set({ secretCode: 'ABC', qrCodeUri: '' });
    component.totpVerifyForm.setValue({ totpCode: '000000' });

    component.submitTotpVerify();
    fixture.detectChanges();

    expect(component.totpError()).toContain('Invalid code');
    expect(component.totpVerified()).toBe(false);
  });

  it('should save MFA preferences', () => {
    component.mfaPrefForm.setValue({
      totpEnabled: true,
      smsEnabled: false,
      preferredMethod: 'TOTP'
    });

    component.submitMfaPreferences();
    fixture.detectChanges();

    expect(apiSpy.setMfaPreference).toHaveBeenCalledWith(true, false, 'TOTP');
    expect(component.mfaPrefSuccess()).toBe(true);
  });

  it('should show error when saving MFA preferences fails', () => {
    apiSpy.setMfaPreference.mockReturnValue(throwError(() => new Error('Server error')));
    component.mfaPrefForm.setValue({
      totpEnabled: true,
      smsEnabled: true,
      preferredMethod: 'SMS'
    });

    component.submitMfaPreferences();
    fixture.detectChanges();

    expect(component.mfaPrefError()).toContain('Server error');
    expect(component.mfaPrefSuccess()).toBe(false);
  });

  it('should handle error when TOTP setup fails', () => {
    apiSpy.setupTotp.mockReturnValue(throwError(() => new Error('Setup failed')));

    component.startTotpSetup();
    fixture.detectChanges();

    expect(component.totpError()).toBe('Setup failed');
    expect(component.settingUpTotp()).toBe(false);
  });

  it('should not verify TOTP when code is empty', () => {
    component.totpVerifyForm.setValue({ totpCode: '' });

    component.submitTotpVerify();

    expect(apiSpy.verifyTotp).not.toHaveBeenCalled();
  });
});
