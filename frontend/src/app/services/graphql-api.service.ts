import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface CurrentUser {
  username: string;
  email: string;
  roles: string[];
  profilePictureUrl?: string;
}

export interface UserSettings {
  userId: string;
  profilePictureSource: string;
  profilePictureS3Key: string | null;
  theme: string;
  locale: string;
}

export interface ProfilePictureInfo {
  url: string;
  source: string;
  uploadEnabled: boolean;
}

export interface CognitoUser {
  username: string;
  email: string;
  emailVerified: boolean;
  confirmationStatus: string;
  status: string;
  enabled: boolean;
  created: string;
  lastUpdatedTime: string;
  modified: string;
  mfaSetting: string;
  groups: string[];
}

export interface CognitoUserPage {
  items: CognitoUser[];
  page: number;
  size: number;
  total: number;
  cursor: string | null;
}

export interface TrustedDevice {
  deviceKey: string;
  deviceName: string;
  lastAuthenticatedDate: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface MfaSetupResponse {
  secretCode: string;
  qrCodeUri: string;
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable({ providedIn: 'root' })
export class GraphqlApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:8080/api/v1/graphql'; // NOSONAR

  me(): Observable<CurrentUser> {
    const query = `query { me { username email roles profilePictureUrl } }`;
    return this.execute<{ me: CurrentUser }>(query).pipe(map((result) => result.me));
  }

  userSettings(): Observable<UserSettings> {
    const query = `query { userSettings { userId profilePictureSource profilePictureS3Key theme locale } }`;
    return this.execute<{ userSettings: UserSettings }>(query).pipe(map((result) => result.userSettings));
  }

  updateUserSettings(input: { theme?: string; locale?: string }): Observable<UserSettings> {
    const query = `mutation UpdateUserSettings($input: UserSettingsInput!) {
      updateUserSettings(input: $input) { userId profilePictureSource profilePictureS3Key theme locale }
    }`;
    return this.execute<{ updateUserSettings: UserSettings }>(query, { input }).pipe(
      map((result) => result.updateUserSettings)
    );
  }

  getProfilePictureUploadUrl(): Observable<{ uploadUrl: string }> {
    return this.http.get<{ uploadUrl: string }>(
      'http://localhost:8080/api/v1/profile-picture/upload-url', // NOSONAR
      { withCredentials: true }
    );
  }

  confirmProfilePictureUpload(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      'http://localhost:8080/api/v1/profile-picture/confirm-upload', // NOSONAR
      {},
      { withCredentials: true }
    );
  }

  getProfilePictureInfo(): Observable<ProfilePictureInfo> {
    return this.http.get<ProfilePictureInfo>(
      'http://localhost:8080/api/v1/profile-picture/url', // NOSONAR
      { withCredentials: true }
    );
  }

  getProfilePictureUrlForUser(username: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(
      `http://localhost:8080/api/v1/profile-picture/url/${encodeURIComponent(username)}`, // NOSONAR
      { withCredentials: true }
    );
  }

  deleteProfilePicture(): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(
      'http://localhost:8080/api/v1/profile-picture', // NOSONAR
      { withCredentials: true }
    );
  }

  users(page: number, size: number, sortBy: string, direction: 'asc' | 'desc'): Observable<CognitoUserPage> {
    const query = `query Users($page: Int!, $size: Int!, $sortBy: String!, $direction: String!) {
      users(page: $page, size: $size, sortBy: $sortBy, direction: $direction) {
        page
        size
        total
        cursor
        items {
          username
          email
          emailVerified
          confirmationStatus
          status
          enabled
          created
          lastUpdatedTime
          modified
          mfaSetting
          groups
        }
      }
    }`;
    return this.execute<{ users: CognitoUserPage }>(query, { page, size, sortBy, direction }).pipe(
      map((result) => result.users)
    );
  }

  user(username: string): Observable<CognitoUser> {
    const query = `query User($username: String!) {
      user(username: $username) {
        username
        email
        emailVerified
        confirmationStatus
        status
        enabled
        created
        lastUpdatedTime
        modified
        mfaSetting
        groups
      }
    }`;
    return this.execute<{ user: CognitoUser }>(query, { username }).pipe(map((result) => result.user));
  }

  groups(): Observable<string[]> {
    const query = `query { groups }`;
    return this.execute<{ groups: string[] }>(query).pipe(map((result) => result.groups));
  }

  updateUser(input: {
    username: string;
    email: string;
    enabled: boolean;
    groups: string[];
  }): Observable<CognitoUser> {
    const query = `mutation UpdateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        username
        email
        emailVerified
        confirmationStatus
        status
        enabled
        created
        lastUpdatedTime
        modified
        mfaSetting
        groups
      }
    }`;

    return this.execute<{ updateUser: CognitoUser }>(query, { input }).pipe(map((result) => result.updateUser));
  }

  deleteUser(username: string): Observable<boolean> {
    const query = `mutation DeleteUser($username: String!) { deleteUser(username: $username) }`;
    return this.execute<{ deleteUser: boolean }>(query, { username }).pipe(map((result) => result.deleteUser));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    const query = `mutation ChangePassword($input: ChangePasswordInput!) { changePassword(input: $input) }`;
    return this.execute<{ changePassword: boolean }>(query, { input: { currentPassword, newPassword } }).pipe(
      map((result) => result.changePassword)
    );
  }

  trustedDevices(): Observable<TrustedDevice[]> {
    const query = `query { trustedDevices { deviceKey deviceName lastAuthenticatedDate createdDate lastModifiedDate } }`;
    return this.execute<{ trustedDevices: TrustedDevice[] }>(query).pipe(map((result) => result.trustedDevices));
  }

  forgetDevice(deviceKey: string): Observable<boolean> {
    const query = `mutation ForgetDevice($deviceKey: String!) { forgetDevice(deviceKey: $deviceKey) }`;
    return this.execute<{ forgetDevice: boolean }>(query, { deviceKey }).pipe(map((result) => result.forgetDevice));
  }

  setMfaPreference(totpEnabled: boolean, smsEnabled: boolean, preferredMethod: string): Observable<boolean> {
    const query = `mutation SetMfa($input: MfaPreferenceInput!) { setMfaPreference(input: $input) }`;
    return this.execute<{ setMfaPreference: boolean }>(query, { input: { totpEnabled, smsEnabled, preferredMethod } }).pipe(
      map((result) => result.setMfaPreference)
    );
  }

  setupTotp(): Observable<MfaSetupResponse> {
    const query = `mutation { setupTotp { secretCode qrCodeUri } }`;
    return this.execute<{ setupTotp: MfaSetupResponse }>(query).pipe(map((result) => result.setupTotp));
  }

  verifyTotp(code: string): Observable<boolean> {
    const query = `mutation VerifyTotp($code: String!) { verifyTotp(code: $code) }`;
    return this.execute<{ verifyTotp: boolean }>(query, { code }).pipe(map((result) => result.verifyTotp));
  }

  private execute<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post(
        this.endpoint,
        { query, variables },
        {
          withCredentials: true,
          responseType: 'text'
        }
      )
      .pipe(
        map((rawBody) => {
          let response: GraphqlResponse<T>;
          try {
            response = JSON.parse(rawBody) as GraphqlResponse<T>;
          } catch {
            throw new Error('AUTH_REQUIRED');
          }

          if (response.errors?.length) {
            if (response.errors[0].message === 'Not signed in') {
              throw new Error('AUTH_REQUIRED');
            }
            throw new Error(response.errors[0].message);
          }
          if (!response.data) {
            throw new Error('No GraphQL data returned');
          }
          return response.data;
        }),
        catchError((error: unknown) => {
          if (this.isAuthError(error)) {
            return throwError(() => new Error('AUTH_REQUIRED'));
          }
          return throwError(() => (error instanceof Error ? error : new Error('Unknown GraphQL error')));
        })
      );
  }

  private isAuthError(error: unknown): boolean {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return true;
    }

    if (error instanceof HttpErrorResponse) {
      return error.status === 401 || error.status === 403;
    }

    return false;
  }
}
