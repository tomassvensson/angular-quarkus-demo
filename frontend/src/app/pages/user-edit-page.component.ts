import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GraphqlApiService } from '../services/graphql-api.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-user-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="panel">
      <h2>{{ i18n.t('userEdit.title') }}</h2>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (saved()) {
        <p>{{ i18n.t('userEdit.saved') }}</p>
      }

      @if (loading()) {
        <p class="muted">{{ i18n.t('common.loading') }}</p>
      } @else {
        <form class="form-grid" (ngSubmit)="save()">
          <div class="detail-card">
            <label for="username">{{ i18n.t('admin.username') }}</label>
            <input id="username" [value]="username()" disabled />
          </div>

          <div class="detail-card">
            <label for="email">{{ i18n.t('admin.email') }}</label>
            <input id="email" [(ngModel)]="email" name="email" />
          </div>

          <div class="row detail-card">
            <input id="enabled" type="checkbox" [(ngModel)]="enabled" name="enabled" />
            <label for="enabled">{{ i18n.t('admin.enabled') }}</label>
          </div>

          <div class="detail-card">
            <label>{{ i18n.t('admin.groupMembership') }}</label>
            <div class="group-grid">
              @for (group of availableGroups(); track group) {
                <label class="group-pill">
                  <input
                    type="checkbox"
                    [checked]="isGroupSelected(group)"
                    (change)="toggleGroup(group, $any($event.target).checked)"
                  />
                  <span>{{ group }}</span>
                </label>
              }
            </div>
          </div>

          <div class="row">
            <button class="btn" type="submit">{{ i18n.t('userEdit.save') }}</button>
            <a class="btn" routerLink="/users">{{ i18n.t('userEdit.backToUsers') }}</a>
          </div>
        </form>
      }
    </section>
  `
})
export class UserEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(GraphqlApiService);
  protected readonly i18n = inject(I18nService);

  protected readonly username = signal('');
  protected readonly loading = signal(true);
  protected readonly saved = signal(false);
  protected readonly error = signal('');
  protected readonly availableGroups = signal<string[]>([]);

  protected email = '';
  protected enabled = true;
  protected selectedGroups: string[] = [];

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.username.set(username);
    this.loadAvailableGroups();
    this.loadUser();
  }

  protected save(): void {
    this.saved.set(false);
    this.error.set('');

    this.api
      .updateUser({
        username: this.username(),
        email: this.email,
        enabled: this.enabled,
        groups: this.selectedGroups
      })
      .subscribe({
        next: (user) => {
          this.email = user.email;
          this.enabled = user.enabled;
          this.selectedGroups = [...(user.groups ?? [])];
          this.saved.set(true);
        },
        error: (err: Error) => {
          if (err.message === 'AUTH_REQUIRED') {
            globalThis.location.assign('/');
            return;
          }
          this.error.set(err.message || 'Could not save user');
        }
      });
  }

  protected isGroupSelected(group: string): boolean {
    return this.selectedGroups.includes(group);
  }

  protected toggleGroup(group: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedGroups.includes(group)) {
        this.selectedGroups = [...this.selectedGroups, group];
      }
      return;
    }
    this.selectedGroups = this.selectedGroups.filter((item) => item !== group);
  }

  private loadAvailableGroups(): void {
    this.api.groups().subscribe({
      next: (groups) => this.availableGroups.set(groups),
      error: (err: Error) => {
        if (err.message === 'AUTH_REQUIRED') {
          globalThis.location.assign('/');
          return;
        }
        this.availableGroups.set([]);
      }
    });
  }

  private loadUser(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.user(this.username()).subscribe({
      next: (user) => {
        this.email = user.email;
        this.enabled = user.enabled;
        this.selectedGroups = [...(user.groups ?? [])];
        this.loading.set(false);
      },
      error: (err: Error) => {
        if (err.message === 'AUTH_REQUIRED') {
          globalThis.location.assign('/');
          return;
        }
        this.error.set(err.message || 'Could not load user');
        this.loading.set(false);
      }
    });
  }
}
