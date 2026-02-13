import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CognitoUserPage, GraphqlApiService } from '../services/graphql-api.service';

@Component({
  selector: 'app-admin-users-page',
  imports: [DatePipe],
  template: `
    <section class="panel">
      <h2>Users</h2>
      <p class="muted">Admin view with pagination and sortable columns.</p>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="table-wrap users-table-wrap">
        <table class="users-table">
          <thead>
            <tr>
              <th><button (click)="sort('username')">Username {{ sortIndicator('username') }}</button></th>
              <th><button (click)="sort('email')">Email {{ sortIndicator('email') }}</button></th>
              <th>
                <button (click)="sort('emailVerified')">Email verified {{ sortIndicator('emailVerified') }}</button>
              </th>
              <th>
                <button (click)="sort('confirmationStatus')">
                  Confirmation status {{ sortIndicator('confirmationStatus') }}
                </button>
              </th>
              <th><button (click)="sort('status')">Status {{ sortIndicator('status') }}</button></th>
              <th><button (click)="sort('enabled')">Enabled {{ sortIndicator('enabled') }}</button></th>
              <th><button (click)="sort('created')">Created {{ sortIndicator('created') }}</button></th>
              <th>
                <button (click)="sort('lastUpdatedTime')">
                  Last updated {{ sortIndicator('lastUpdatedTime') }}
                </button>
              </th>
              <th><button (click)="sort('mfaSetting')">MFA setting {{ sortIndicator('mfaSetting') }}</button></th>
              <th>Group membership</th>
            </tr>
          </thead>
          <tbody>
            @for (user of pageData()?.items ?? []; track user.username) {
              <tr (click)="openUser(user.username)">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.emailVerified ? 'Yes' : 'No' }}</td>
                <td>{{ user.confirmationStatus }}</td>
                <td>{{ user.status }}</td>
                <td>{{ user.enabled ? 'Yes' : 'No' }}</td>
                <td>{{ user.created | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ user.lastUpdatedTime | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ user.mfaSetting }}</td>
                <td>{{ user.groups.join(', ') || 'None' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="row pager-row" style="margin-top: 0.75rem;">
        <button class="btn pager-btn" (click)="previousPage()" [disabled]="page() === 0">Previous</button>
        <button class="btn pager-btn" (click)="nextPage()" [disabled]="isLastPage()">Next</button>
        <span class="muted">Page {{ page() + 1 }} / {{ totalPages() }}</span>
        <span class="muted">Total users: {{ pageData()?.total ?? 0 }}</span>
      </div>
    </section>
  `
})
export class AdminUsersPageComponent implements OnInit {
  private readonly api = inject(GraphqlApiService);
  private readonly router = inject(Router);

  protected readonly pageData = signal<CognitoUserPage | null>(null);
  protected readonly error = signal('');
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly sortBy = signal('username');
  protected readonly direction = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.load();
  }

  protected sort(field: string): void {
    if (this.sortBy() === field) {
      this.direction.set(this.direction() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.direction.set('asc');
    }
    this.page.set(0);
    this.load();
  }

  protected sortIndicator(field: string): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.direction() === 'asc' ? '↑' : '↓';
  }

  protected previousPage(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.load();
    }
  }

  protected nextPage(): void {
    if (!this.isLastPage()) {
      this.page.set(this.page() + 1);
      this.load();
    }
  }

  protected totalPages(): number {
    const total = this.pageData()?.total ?? 0;
    return Math.max(1, Math.ceil(total / this.size()));
  }

  protected isLastPage(): boolean {
    return this.page() >= this.totalPages() - 1;
  }

  protected openUser(username: string): void {
    this.router.navigate(['/users', username]);
  }

  private load(): void {
    this.error.set('');
    this.api.users(this.page(), this.size(), this.sortBy(), this.direction()).subscribe({
      next: (result) => this.pageData.set(result),
      error: (err: Error) => this.error.set(err.message || 'Could not load users')
    });
  }
}
