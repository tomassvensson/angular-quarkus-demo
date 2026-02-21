import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraphqlApiService, CognitoUser, TrustedDevice, MfaSetupResponse } from '../services/graphql-api.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>{{ i18n.t('profile.title') }}</h2>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="muted">{{ i18n.t('profile.loading') }}</p>
      } @else if (user()) {
        <div class="form-grid">
          <div class="detail-card">
            <label for="username">{{ i18n.t('profile.username') }}</label>
            <input id="username" [value]="user()?.username" disabled />
          </div>

          <div class="detail-card">
            <label for="email">{{ i18n.t('profile.email') }}</label>
            <input id="email" [value]="user()?.email" disabled />
          </div>

          <div class="detail-card">
            <label>{{ i18n.t('profile.rolesGroups') }}</label>
            <div class="group-grid">
              @for (group of user()?.groups; track group) {
                <span class="group-pill">{{ group }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Password Change Section -->
        <div class="password-section">
          <h3>{{ i18n.t('profile.changePassword') }}</h3>

          @if (passwordSuccess()) {
            <p class="success">{{ i18n.t('profile.passwordChanged') }}</p>
          }
          @if (passwordError()) {
            <p class="error">{{ passwordError() }}</p>
          }

          <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordChange()" class="password-form">
            <div class="form-field">
              <label for="currentPassword">{{ i18n.t('profile.currentPassword') }}</label>
              <input id="currentPassword" type="password" formControlName="currentPassword"
                     autocomplete="current-password" />
            </div>
            <div class="form-field">
              <label for="newPassword">{{ i18n.t('profile.newPassword') }}</label>
              <input id="newPassword" type="password" formControlName="newPassword"
                     autocomplete="new-password" />
            </div>
            <div class="form-field">
              <label for="confirmPassword">{{ i18n.t('profile.confirmPassword') }}</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword"
                     autocomplete="new-password" />
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="changingPassword()">
              {{ i18n.t('profile.changePassword') }}
            </button>
          </form>
        </div>

        <!-- MFA Section -->
        <div class="mfa-section">
          <h3>{{ i18n.t('mfa.title') }}</h3>

          <!-- Trusted Devices -->
          <div class="mfa-subsection">
            <h4>{{ i18n.t('mfa.trustedDevices') }}</h4>
            @if (trustedDevices().length === 0) {
              <p class="muted">{{ i18n.t('mfa.noDevices') }}</p>
            } @else {
              <ul class="device-list" role="list">
                @for (device of trustedDevices(); track device.deviceKey) {
                  <li class="device-item">
                    <div class="device-info">
                      <strong>{{ device.deviceName || device.deviceKey }}</strong>
                      @if (device.lastAuthenticatedDate) {
                        <span class="muted device-date">{{ device.lastAuthenticatedDate }}</span>
                      }
                    </div>
                    <button class="btn btn-danger btn-sm"
                            (click)="removeDevice(device)">{{ i18n.t('mfa.removeDevice') }}</button>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- TOTP Setup -->
          <div class="mfa-subsection">
            <h4>{{ i18n.t('mfa.setupTotp') }}</h4>

            @if (totpVerified()) {
              <p class="success">{{ i18n.t('mfa.verified') }}</p>
            }
            @if (totpError()) {
              <p class="error">{{ totpError() }}</p>
            }

            @if (!totpSetup()) {
              <button class="btn btn-primary" (click)="startTotpSetup()" [disabled]="settingUpTotp()">
                {{ i18n.t('mfa.setupTotp') }}
              </button>
            } @else {
              <p>{{ i18n.t('mfa.totpInstructions') }}</p>
              <div class="totp-details">
                <div class="form-field">
                  <label>{{ i18n.t('mfa.secretKey') }}</label>
                  <code class="secret-code">{{ totpSetup()?.secretCode }}</code>
                </div>
                @if (totpSetup()?.qrCodeUri) {
                  <div class="qr-container">
                    <img [src]="totpSetup()?.qrCodeUri" alt="TOTP QR Code" width="200" height="200" />
                  </div>
                }
                <form [formGroup]="totpVerifyForm" (ngSubmit)="submitTotpVerify()" class="totp-verify-form">
                  <div class="form-field">
                    <label for="totpCode">{{ i18n.t('mfa.enterCode') }}</label>
                    <input id="totpCode" type="text" formControlName="totpCode"
                           autocomplete="one-time-code" inputmode="numeric" />
                  </div>
                  <button type="submit" class="btn btn-primary" [disabled]="verifyingTotp()">
                    {{ i18n.t('mfa.verify') }}
                  </button>
                </form>
              </div>
            }
          </div>

          <!-- MFA Preferences -->
          <div class="mfa-subsection">
            <h4>{{ i18n.t('mfa.preferences') }}</h4>

            @if (mfaPrefSuccess()) {
              <p class="success">{{ i18n.t('mfa.preferencesSaved') }}</p>
            }
            @if (mfaPrefError()) {
              <p class="error">{{ mfaPrefError() }}</p>
            }

            <form [formGroup]="mfaPrefForm" (ngSubmit)="submitMfaPreferences()" class="mfa-pref-form">
              <div class="form-field checkbox-field">
                <label>
                  <input type="checkbox" formControlName="totpEnabled" />
                  {{ i18n.t('mfa.enableTotp') }}
                </label>
              </div>
              <div class="form-field checkbox-field">
                <label>
                  <input type="checkbox" formControlName="smsEnabled" />
                  {{ i18n.t('mfa.enableSms') }}
                </label>
              </div>
              <div class="form-field">
                <label for="preferredMethod">{{ i18n.t('mfa.preferredMethod') }}</label>
                <select id="preferredMethod" formControlName="preferredMethod">
                  <option value="NONE">{{ i18n.t('mfa.none') }}</option>
                  <option value="TOTP">{{ i18n.t('mfa.totp') }}</option>
                  <option value="SMS">{{ i18n.t('mfa.sms') }}</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="savingMfaPref()">
                {{ i18n.t('mfa.savePreferences') }}
              </button>
            </form>
          </div>
        </div>

        <div class="actions" style="margin-top: 20px;">
           <button class="btn btn-danger" (click)="deleteAccount()">{{ i18n.t('profile.deleteAccount') }}</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .detail-card { margin-bottom: 1rem; }
    .group-pill { background: var(--color-pill-bg); color: var(--color-pill-text); border: 1px solid var(--color-pill-border); padding: 4px 8px; border-radius: 4px; margin-right: 8px; display: inline-block; }
    .btn-danger {
      background-color: var(--color-error);
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-danger:hover { background-color: var(--color-error); filter: brightness(0.85); }
    .btn-primary {
      background-color: var(--color-link);
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-primary:hover { filter: brightness(0.85); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    input[disabled] { background-color: var(--color-input-bg); color: var(--color-text-muted); }
    .password-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }
    .password-section h3 { margin-bottom: 1rem; }
    .password-form { max-width: 400px; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 4px; font-weight: 500; }
    .form-field input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-input-bg);
      color: var(--color-text);
      box-sizing: border-box;
    }
    .success { color: var(--color-success, #22c55e); font-weight: 500; }
    .mfa-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }
    .mfa-section h3 { margin-bottom: 1rem; }
    .mfa-subsection {
      margin-top: 1.5rem;
      padding: 1rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface, var(--color-input-bg));
    }
    .mfa-subsection h4 { margin-top: 0; margin-bottom: 0.75rem; }
    .device-list { list-style: none; padding: 0; margin: 0; }
    .device-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .device-item:last-child { border-bottom: none; }
    .device-info { display: flex; flex-direction: column; gap: 2px; }
    .device-date { font-size: 0.85em; }
    .btn-sm { padding: 4px 10px; font-size: 0.85rem; }
    .secret-code {
      display: block;
      padding: 8px;
      background: var(--color-input-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      word-break: break-all;
      font-family: monospace;
    }
    .qr-container { margin: 1rem 0; }
    .totp-verify-form { max-width: 300px; margin-top: 1rem; }
    .totp-details { max-width: 400px; }
    .mfa-pref-form { max-width: 400px; }
    .checkbox-field label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .checkbox-field input[type="checkbox"] { width: auto; }
    select {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-input-bg);
      color: var(--color-text);
      box-sizing: border-box;
    }
  `]
})
export class ProfilePageComponent implements OnInit {
  private readonly api = inject(GraphqlApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly user = signal<CognitoUser | null>(null);
  readonly passwordSuccess = signal(false);
  readonly passwordError = signal('');
  readonly changingPassword = signal(false);

  // MFA state
  readonly trustedDevices = signal<TrustedDevice[]>([]);
  readonly totpSetup = signal<MfaSetupResponse | null>(null);
  readonly totpVerified = signal(false);
  readonly totpError = signal('');
  readonly settingUpTotp = signal(false);
  readonly verifyingTotp = signal(false);
  readonly mfaPrefSuccess = signal(false);
  readonly mfaPrefError = signal('');
  readonly savingMfaPref = signal(false);

  readonly passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

  readonly totpVerifyForm: FormGroup = this.fb.group({
    totpCode: ['', Validators.required],
  });

  readonly mfaPrefForm: FormGroup = this.fb.group({
    totpEnabled: [false],
    smsEnabled: [false],
    preferredMethod: ['NONE'],
  });

  ngOnInit() {
    this.load();
    this.loadTrustedDevices();
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

  submitPasswordChange() {
    this.passwordSuccess.set(false);
    this.passwordError.set('');

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordError.set(this.i18n.t('profile.passwordRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordError.set(this.i18n.t('profile.passwordMismatch'));
      return;
    }

    this.changingPassword.set(true);
    this.api.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        this.changingPassword.set(false);
      },
      error: (err: Error) => {
        this.passwordError.set(this.i18n.t('profile.passwordChangeFailed', { error: err.message }));
        this.changingPassword.set(false);
      }
    });
  }

  loadTrustedDevices() {
    this.api.trustedDevices().subscribe({
      next: (devices) => this.trustedDevices.set(devices),
      error: () => this.trustedDevices.set([])
    });
  }

  removeDevice(device: TrustedDevice) {
    const name = device.deviceName || device.deviceKey;
    if (confirm(this.i18n.t('mfa.removeDeviceConfirm', { name }))) {
      this.api.forgetDevice(device.deviceKey).subscribe({
        next: () => this.loadTrustedDevices(),
        error: (err: Error) => this.error.set(err.message)
      });
    }
  }

  startTotpSetup() {
    this.settingUpTotp.set(true);
    this.totpVerified.set(false);
    this.totpError.set('');
    this.api.setupTotp().subscribe({
      next: (response) => {
        this.totpSetup.set(response);
        this.settingUpTotp.set(false);
      },
      error: (err: Error) => {
        this.totpError.set(err.message);
        this.settingUpTotp.set(false);
      }
    });
  }

  submitTotpVerify() {
    const code = this.totpVerifyForm.value.totpCode;
    if (!code) return;

    this.verifyingTotp.set(true);
    this.totpVerified.set(false);
    this.totpError.set('');
    this.api.verifyTotp(code).subscribe({
      next: () => {
        this.totpVerified.set(true);
        this.totpSetup.set(null);
        this.totpVerifyForm.reset();
        this.verifyingTotp.set(false);
      },
      error: (err: Error) => {
        this.totpError.set(this.i18n.t('mfa.verifyFailed', { error: err.message }));
        this.verifyingTotp.set(false);
      }
    });
  }

  submitMfaPreferences() {
    this.mfaPrefSuccess.set(false);
    this.mfaPrefError.set('');
    this.savingMfaPref.set(true);

    const { totpEnabled, smsEnabled, preferredMethod } = this.mfaPrefForm.value;
    this.api.setMfaPreference(totpEnabled, smsEnabled, preferredMethod).subscribe({
      next: () => {
        this.mfaPrefSuccess.set(true);
        this.savingMfaPref.set(false);
      },
      error: (err: Error) => {
        this.mfaPrefError.set(this.i18n.t('mfa.preferencesFailed', { error: err.message }));
        this.savingMfaPref.set(false);
      }
    });
  }

  deleteAccount() {
    if (!this.user()) return;
    const email = this.user()!.email;
    if (confirm(this.i18n.t('profile.deleteConfirm', { email }))) {
        this.loading.set(true);
        this.api.deleteUser(this.user()!.username).subscribe({
            next: () => {
                alert(this.i18n.t('profile.deleted'));
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
