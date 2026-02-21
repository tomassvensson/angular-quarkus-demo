import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUser, GraphqlApiService } from './services/graphql-api.service';
import { LogCollectorService } from './services/log-collector.service';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';
import { NotificationBellComponent } from './components/notification-bell.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import { LanguageSelectorComponent } from './components/language-selector.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent, LanguageSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly api = inject(GraphqlApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly logCollector = inject(LogCollectorService);
  private readonly themeService = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  private sessionProbeId: ReturnType<typeof setInterval> | null = null;
  private hadAuthenticatedSession = false;

  protected readonly title = signal('Angular + Quarkus Cognito Demo');
  protected readonly me = signal<CurrentUser | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly signInUrl = 'http://localhost:8080/login'; // NOSONAR
  protected readonly signOutUrl = 'http://localhost:8080/logout'; // NOSONAR
  protected readonly isSignedIn = computed(() => !!this.me());
  protected readonly isAdmin = computed(() => {
    const roles = this.me()?.roles || [];
    return roles.includes('AdminUser') || roles.includes('admin');
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.logCollector.start();
    this.themeService.initialize();
    this.i18n.initialize();
    this.reloadMe();
    this.sessionProbeId = setInterval(() => this.reloadMe(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.sessionProbeId) {
      clearInterval(this.sessionProbeId);
      this.sessionProbeId = null;
    }
    this.logCollector.stop();
  }

  protected reloadMe(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.me().subscribe({
      next: (user) => {
        this.hadAuthenticatedSession = true;
        this.me.set(user);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.me.set(null);
        this.loading.set(false);

        if (this.hadAuthenticatedSession && err.message === 'AUTH_REQUIRED') {
          this.hadAuthenticatedSession = false;
          globalThis.location.assign('/');
        }
      }
    });
  }
}
