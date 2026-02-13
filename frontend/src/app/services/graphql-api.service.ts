import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface CurrentUser {
  username: string;
  email: string;
  roles: string[];
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
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable({ providedIn: 'root' })
export class GraphqlApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:8080/api/v1/graphql';

  me(): Observable<CurrentUser> {
    const query = `query { me { username email roles } }`;
    return this.execute<{ me: CurrentUser }>(query).pipe(map((result) => result.me));
  }

  users(page: number, size: number, sortBy: string, direction: 'asc' | 'desc'): Observable<CognitoUserPage> {
    const query = `query Users($page: Int!, $size: Int!, $sortBy: String!, $direction: String!) {
      users(page: $page, size: $size, sortBy: $sortBy, direction: $direction) {
        page
        size
        total
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

  private execute<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(
        this.endpoint,
        { query, variables },
        {
          withCredentials: true
        }
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors[0].message);
          }
          if (!response.data) {
            throw new Error('No GraphQL data returned');
          }
          return response.data;
        })
      );
  }
}
