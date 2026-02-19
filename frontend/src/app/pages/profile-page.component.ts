import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GraphqlApiService, CognitoUser } from '../services/graphql-api.service';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel">
      <h2>My Profile</h2>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="muted">Loading...</p>
      } @else if (user()) {
        <div class="form-grid">
          <div class="detail-card">
            <label for="username">Username</label>
            <input id="username" [value]="user()?.username" disabled />
          </div>

          <div class="detail-card">
            <label for="email">Email</label>
            <input id="email" [value]="user()?.email" disabled />
          </div>

          <div class="detail-card">
            <label>Roles/Groups</label>
            <div class="group-grid">
              @for (group of user()?.groups; track group) {
                <span class="group-pill">{{ group }}</span>
              }
            </div>
          </div>
          
          <div class="actions" style="margin-top: 20px;">
             <button class="btn btn-danger" (click)="deleteAccount()">Delete Account</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .detail-card { margin-bottom: 1rem; }
    .group-pill { background: #eee; padding: 4px 8px; border-radius: 4px; margin-right: 8px; display: inline-block; }
    .btn-danger {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-danger:hover { background-color: #bb2d3b; }
    input[disabled] { background-color: #f8f9fa; color: #666; }
  `]
})
export class ProfilePageComponent implements OnInit {
  private readonly api = inject(GraphqlApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly user = signal<CognitoUser | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    // First get 'me' to find username, then get details
    this.api.me().subscribe({
        next: (me) => {
            this.api.user(me.username).subscribe({
                next: (details) => {
                    // Fallback to roles from token if groups are empty (e.g. running locally with Keycloak but configured as Cognito)
                    if (!details.groups || details.groups.length === 0) {
                        details.groups = me.roles;
                    }
                    this.user.set(details);
                    this.loading.set(false);
                },
                error: (err) => {
                    // Fallback for when user details api fails but me succeeds
                    // Construct a partial user object from me
                    console.error('Error fetching user details, falling back to me info', err);
                    const partialUser: any = {
                        username: me.username,
                        email: me.email,
                        groups: me.roles,
                        enabled: true,
                        status: 'Unknown',
                        created: new Date().toISOString(),
                        lastUpdatedTime: new Date().toISOString(),
                        modified: new Date().toISOString(),
                        emailVerified: true,
                        confirmationStatus: 'Confirmed',
                        mfaSetting: 'OFF'
                    };
                    this.user.set(partialUser);
                    this.loading.set(false);
                }
            });
        },
        error: (err) => {
            if (err.message === 'AUTH_REQUIRED') {
                this.router.navigate(['/']);
            } else {
                this.error.set(err.message);
            }
            this.loading.set(false);
        }
    });
  }

  deleteAccount() {
    if (!this.user()) return;
    const email = this.user()!.email;
    if (confirm(`Are you sure you want to delete your account (${email})? This action cannot be undone.`)) {
        this.loading.set(true);
        this.api.deleteUser(this.user()!.username).subscribe({
            next: () => {
                alert('Account deleted.');
                // Force logout by redirecting to sign out url
                globalThis.location.href = 'http://localhost:8080/logout'; // NOSONAR
            },
            error: (err) => {
                this.loading.set(false);
                this.error.set(err.message || 'Could not delete account');
            }
        });
    }
  }
}
