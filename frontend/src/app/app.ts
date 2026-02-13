import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUser, GraphqlApiService } from './services/graphql-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly api = inject(GraphqlApiService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly title = signal('Angular + Quarkus Cognito Demo');
  protected readonly me = signal<CurrentUser | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly signInUrl = 'http://localhost:8080/login';
  protected readonly signOutUrl = 'http://localhost:8080/logout';
  protected readonly isSignedIn = computed(() => !!this.me());
  protected readonly isAdmin = computed(() => this.me()?.roles.includes('AdminUser') ?? false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.reloadMe();
  }

  protected reloadMe(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.me().subscribe({
      next: (user) => {
        this.me.set(user);
        this.loading.set(false);
      },
      error: () => {
        this.me.set(null);
        this.loading.set(false);
      }
    });
  }
}
