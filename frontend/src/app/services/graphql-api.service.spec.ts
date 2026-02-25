import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GraphqlApiService, CurrentUser, UserSettings, CognitoUser, CognitoUserPage, ProfilePictureInfo, TrustedDevice, MfaSetupResponse } from './graphql-api.service';

describe('GraphqlApiService', () => {
  let service: GraphqlApiService;
  let httpMock: HttpTestingController;
  const endpoint = 'http://localhost:8080/api/v1/graphql'; // NOSONAR

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GraphqlApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(GraphqlApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- me() ---
  it('should return current user from me()', () => {
    const mockUser: CurrentUser = { username: 'alice', email: 'alice@test.com', roles: ['user'] };
    let result: CurrentUser | undefined;

    service.me().subscribe({ next: (user) => result = user });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.query).toContain('me');
    req.flush(JSON.stringify({ data: { me: mockUser } }));

    expect(result?.username).toBe('alice');
    expect(result?.email).toBe('alice@test.com');
  });

  // --- userSettings() ---
  it('should return user settings', () => {
    const mockSettings: UserSettings = {
      userId: 'alice', profilePictureSource: 'gravatar',
      profilePictureS3Key: null, theme: 'dark', locale: 'en'
    };
    let result: UserSettings | undefined;

    service.userSettings().subscribe({ next: (s) => result = s });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { userSettings: mockSettings } }));

    expect(result?.theme).toBe('dark');
  });

  // --- updateUserSettings() ---
  it('should update user settings', () => {
    const mockSettings: UserSettings = {
      userId: 'alice', profilePictureSource: 'gravatar',
      profilePictureS3Key: null, theme: 'light', locale: 'de'
    };
    let result: UserSettings | undefined;

    service.updateUserSettings({ theme: 'light', locale: 'de' }).subscribe({ next: (s) => result = s });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables).toEqual({ input: { theme: 'light', locale: 'de' } });
    req.flush(JSON.stringify({ data: { updateUserSettings: mockSettings } }));

    expect(result?.theme).toBe('light');
  });

  // --- Profile picture REST endpoints ---
  it('should get profile picture upload URL', () => {
    let result: Record<string, string> | undefined;

    service.getProfilePictureUploadUrl().subscribe({ next: (r) => result = r as Record<string, string> });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture/upload-url'); // NOSONAR
    expect(req.request.withCredentials).toBe(true);
    req.flush({ uploadUrl: 'https://s3.example.com/upload' });

    expect(result?.['uploadUrl']).toBe('https://s3.example.com/upload');
  });

  it('should confirm profile picture upload', () => {
    let result: Record<string, string> | undefined;

    service.confirmProfilePictureUpload().subscribe({ next: (r) => result = r as Record<string, string> });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture/confirm-upload'); // NOSONAR
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'confirmed' });

    expect(result?.['status']).toBe('confirmed');
  });

  it('should get profile picture info', () => {
    const mockInfo: ProfilePictureInfo = { url: 'https://gravatar.com/test', source: 'gravatar', uploadEnabled: true };
    let result: ProfilePictureInfo | undefined;

    service.getProfilePictureInfo().subscribe({ next: (info) => result = info });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture/url'); // NOSONAR
    req.flush(mockInfo);

    expect(result?.source).toBe('gravatar');
    expect(result?.uploadEnabled).toBe(true);
  });

  it('should get profile picture URL for user', () => {
    let result: Record<string, string> | undefined;

    service.getProfilePictureUrlForUser('bob').subscribe({ next: (r) => result = r as Record<string, string> });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture/url/bob'); // NOSONAR
    req.flush({ url: 'https://gravatar.com/bob' });

    expect(result?.['url']).toBe('https://gravatar.com/bob');
  });

  it('should delete profile picture', () => {
    let result: Record<string, string> | undefined;

    service.deleteProfilePicture().subscribe({ next: (r) => result = r as Record<string, string> });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture'); // NOSONAR
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'deleted' });

    expect(result?.['status']).toBe('deleted');
  });

  // --- users() ---
  it('should fetch paginated users', () => {
    const mockPage: CognitoUserPage = {
      items: [{ username: 'alice', email: 'a@test.com', emailVerified: true,
        confirmationStatus: 'CONFIRMED', status: 'enabled', enabled: true,
        created: '2024-01-01', lastUpdatedTime: '2024-01-01', modified: '2024-01-01',
        mfaSetting: 'OFF', groups: ['user'] }],
      page: 0, size: 10, total: 1, cursor: null
    };
    let result: CognitoUserPage | undefined;

    service.users(0, 10, 'username', 'asc').subscribe({ next: (p) => result = p });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables).toEqual({ page: 0, size: 10, sortBy: 'username', direction: 'asc' });
    req.flush(JSON.stringify({ data: { users: mockPage } }));

    expect(result?.items.length).toBe(1);
    expect(result?.total).toBe(1);
  });

  // --- user() ---
  it('should fetch single user', () => {
    const mockUser: CognitoUser = {
      username: 'alice', email: 'a@test.com', emailVerified: true,
      confirmationStatus: 'CONFIRMED', status: 'enabled', enabled: true,
      created: '2024-01-01', lastUpdatedTime: '2024-01-01', modified: '2024-01-01',
      mfaSetting: 'OFF', groups: ['user']
    };
    let result: CognitoUser | undefined;

    service.user('alice').subscribe({ next: (u) => result = u });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { user: mockUser } }));

    expect(result?.username).toBe('alice');
  });

  // --- groups() ---
  it('should fetch groups', () => {
    let result: string[] | undefined;

    service.groups().subscribe({ next: (g) => result = g });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { groups: ['admin', 'user'] } }));

    expect(result).toEqual(['admin', 'user']);
  });

  // --- updateUser() ---
  it('should update a user', () => {
    const mockUser: CognitoUser = {
      username: 'bob', email: 'bob@test.com', emailVerified: true,
      confirmationStatus: 'CONFIRMED', status: 'enabled', enabled: true,
      created: '2024-01-01', lastUpdatedTime: '2024-01-01', modified: '2024-01-01',
      mfaSetting: 'OFF', groups: ['admin']
    };
    let result: CognitoUser | undefined;

    service.updateUser({ username: 'bob', email: 'bob@test.com', enabled: true, groups: ['admin'] }).subscribe({
      next: (u) => result = u
    });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { updateUser: mockUser } }));

    expect(result?.groups).toEqual(['admin']);
  });

  // --- deleteUser() ---
  it('should delete a user', () => {
    let result: boolean | undefined;

    service.deleteUser('bob').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { deleteUser: true } }));

    expect(result).toBe(true);
  });

  // --- changePassword() ---
  it('should change password', () => {
    let result: boolean | undefined;

    service.changePassword('oldPass', 'newPass').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables.input).toEqual({ currentPassword: 'oldPass', newPassword: 'newPass' });
    req.flush(JSON.stringify({ data: { changePassword: true } }));

    expect(result).toBe(true);
  });

  // --- trustedDevices() ---
  it('should fetch trusted devices', () => {
    const devices: TrustedDevice[] = [
      { deviceKey: 'dk1', deviceName: 'Phone', lastAuthenticatedDate: '2024-01-01', createdDate: '2024-01-01', lastModifiedDate: '2024-01-01' }
    ];
    let result: TrustedDevice[] | undefined;

    service.trustedDevices().subscribe({ next: (d) => result = d });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { trustedDevices: devices } }));

    expect(result?.length).toBe(1);
    expect(result?.[0].deviceName).toBe('Phone');
  });

  // --- forgetDevice() ---
  it('should forget a device', () => {
    let result: boolean | undefined;

    service.forgetDevice('dk1').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables.deviceKey).toBe('dk1');
    req.flush(JSON.stringify({ data: { forgetDevice: true } }));

    expect(result).toBe(true);
  });

  // --- MFA methods ---
  it('should set MFA preference', () => {
    let result: boolean | undefined;

    service.setMfaPreference(true, false, 'TOTP').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables.input).toEqual({ totpEnabled: true, smsEnabled: false, preferredMethod: 'TOTP' });
    req.flush(JSON.stringify({ data: { setMfaPreference: true } }));

    expect(result).toBe(true);
  });

  it('should setup TOTP', () => {
    const response: MfaSetupResponse = { secretCode: 'SECRET123', qrCodeUri: 'otpauth://totp/test' };
    let result: MfaSetupResponse | undefined;

    service.setupTotp().subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ data: { setupTotp: response } }));

    expect(result?.secretCode).toBe('SECRET123');
  });

  it('should verify TOTP', () => {
    let result: boolean | undefined;

    service.verifyTotp('123456').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.body.variables.code).toBe('123456');
    req.flush(JSON.stringify({ data: { verifyTotp: true } }));

    expect(result).toBe(true);
  });

  // --- Error handling ---
  it('should throw AUTH_REQUIRED on "Not signed in" error', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ errors: [{ message: 'Not signed in' }] }));

    expect(error?.message).toBe('AUTH_REQUIRED');
  });

  it('should throw AUTH_REQUIRED on non-JSON response', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush('<html>Login page</html>');

    expect(error?.message).toBe('AUTH_REQUIRED');
  });

  it('should throw GraphQL error message', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({ errors: [{ message: 'Access denied' }] }));

    expect(error?.message).toBe('Access denied');
  });

  it('should throw on missing data field', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush(JSON.stringify({}));

    expect(error?.message).toBe('No GraphQL data returned');
  });

  it('should convert 401 HTTP error to AUTH_REQUIRED', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(error?.message).toBe('AUTH_REQUIRED');
  });

  it('should convert 403 HTTP error to AUTH_REQUIRED', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(error?.message).toBe('AUTH_REQUIRED');
  });

  it('should pass through non-auth HTTP errors', () => {
    let error: Error | undefined;

    service.me().subscribe({ error: (err) => error = err });

    const req = httpMock.expectOne(endpoint);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.message).not.toBe('AUTH_REQUIRED');
  });

  it('should encode username in profile picture URL for user', () => {
    let result: unknown;

    service.getProfilePictureUrlForUser('user name').subscribe({ next: (r) => result = r });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/profile-picture/url/user%20name'); // NOSONAR
    req.flush({ url: 'https://gravatar.com/test' });

    expect(result).toBeDefined();
  });
});
