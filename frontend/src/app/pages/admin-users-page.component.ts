import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CognitoUserPage, GraphqlApiService } from '../services/graphql-api.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="panel">
      <h2>{{ i18n.t('admin.users') }}</h2>
      <p class="muted">{{ i18n.t('admin.description') }}</p>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="table-wrap users-table-wrap">
        @if (loading()) {
          <div class="table-overlay">{{ i18n.t('admin.loadingUsers') }}</div>
        }
        <table class="users-table">
          <thead>
            <tr>
              <th><button (click)="sort('username')">{{ i18n.t('admin.username') }} {{ sortIndicator('username') }}</button></th>
              <th><button (click)="sort('email')">{{ i18n.t('admin.email') }} {{ sortIndicator('email') }}</button></th>
              <th>
                <button (click)="sort('emailVerified')">{{ i18n.t('admin.emailVerified') }} {{ sortIndicator('emailVerified') }}</button>
              </th>
              <th>
                <button (click)="sort('confirmationStatus')">
                  {{ i18n.t('admin.confirmationStatus') }} {{ sortIndicator('confirmationStatus') }}
                </button>
              </th>
              <th><button (click)="sort('status')">{{ i18n.t('admin.status') }} {{ sortIndicator('status') }}</button></th>
              <th><button (click)="sort('enabled')">{{ i18n.t('admin.enabled') }} {{ sortIndicator('enabled') }}</button></th>
              <th><button (click)="sort('created')">{{ i18n.t('admin.created') }} {{ sortIndicator('created') }}</button></th>
              <th>
                <button (click)="sort('lastUpdatedTime')">
                  {{ i18n.t('admin.lastUpdated') }} {{ sortIndicator('lastUpdatedTime') }}
                </button>
              </th>
              <th><button (click)="sort('mfaSetting')">{{ i18n.t('admin.mfaSetting') }} {{ sortIndicator('mfaSetting') }}</button></th>
              <th>{{ i18n.t('admin.groupMembership') }}</th>
              <th>{{ i18n.t('admin.action') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (user of pageData()?.items ?? []; track user.username) {
              <tr (click)="openUser(user.username)">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.emailVerified ? i18n.t('admin.yes') : i18n.t('admin.no') }}</td>
                <td>{{ user.confirmationStatus }}</td>
                <td>{{ user.status }}</td>
                <td>{{ user.enabled ? i18n.t('admin.yes') : i18n.t('admin.no') }}</td>
                <td>{{ user.created | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ user.lastUpdatedTime | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ user.mfaSetting }}</td>
                <td>{{ user.groups.join(', ') || i18n.t('admin.none') }}</td>
                <td (click)="$event.stopPropagation()">
                  <button class="btn-danger" (click)="deleteUser(user)">{{ i18n.t('common.delete') }}</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="row pager-row" style="margin-top: 0.75rem;">
        <button class="btn pager-btn" (click)="previousPage()" [disabled]="page() === 0">{{ i18n.t('admin.previous') }}</button>
        <button class="btn pager-btn" (click)="nextPage()" [disabled]="isLastPage()">{{ i18n.t('admin.next') }}</button>
        <span class="muted">{{ i18n.t('admin.page') }} {{ page() + 1 }} / {{ totalPages() }}</span>
        <span class="muted">{{ i18n.t('admin.totalUsers') }}: {{ pageData()?.total ?? 0 }}</span>
      </div>
    </section>
  `,
  styles: [`
    /* ... existing styles ... */
    .btn-danger {
      background-color: var(--color-error);
      color: white;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-danger:hover {
      background-color: var(--color-error);
      filter: brightness(0.85);
    }
  `]
})
export class AdminUsersPageComponent implements OnInit {
  private readonly api = inject(GraphqlApiService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly pageData = signal<CognitoUserPage | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal(false);
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

  protected deleteUser(user: { username: string; email: string }): void {
    if (confirm(this.i18n.t('admin.deleteConfirm', { username: user.username, email: user.email }))) {
      this.loading.set(true);
      this.api.deleteUser(user.username).subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.message || 'Could not delete user');
        }
      });
    }
  }

  private load(): void {
    const loadStartedAt = Date.now();
    const minOverlayMs = 220;

    const finishLoading = () => {
      const elapsed = Date.now() - loadStartedAt;
      const wait = Math.max(0, minOverlayMs - elapsed);
      if (wait === 0) {
        this.loading.set(false);
        return;
      }
      globalThis.setTimeout(() => this.loading.set(false), wait);
    };

    this.loading.set(true);
    this.error.set('');
    this.api.users(this.page(), this.size(), this.sortBy(), this.direction()).subscribe({
      next: (result) => {
        this.pageData.set(result);
        finishLoading();
      },
      error: (err: Error) => {
        finishLoading();
        if (err.message === 'AUTH_REQUIRED') {
          this.router.navigate(['/']);
          return;
        }
        this.error.set(err.message || 'Could not load users');
      }
    });
  }
}
