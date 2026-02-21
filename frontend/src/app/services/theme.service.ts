import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'theme-preference';

  readonly mode = signal<ThemeMode>('system');

  readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    const m = this.mode();
    if (m === 'system') return this.systemPrefersDark() ? 'dark' : 'light';
    return m;
  });

  private systemPrefersDark(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = globalThis.localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      this.mode.set(stored);
    }

    this.applyTheme();

    // Listen for system preference changes
    globalThis.matchMedia?.('(prefers-color-scheme: dark)')
      ?.addEventListener('change', () => this.applyTheme());
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      globalThis.localStorage.setItem(this.STORAGE_KEY, mode);
    }
    this.applyTheme();
  }

  /** Sync from user profile (called after login) */
  syncFromProfile(mode: ThemeMode | null): void {
    if (mode && ['light', 'dark', 'system'].includes(mode)) {
      this.mode.set(mode);
      if (isPlatformBrowser(this.platformId)) {
        globalThis.localStorage.setItem(this.STORAGE_KEY, mode);
      }
      this.applyTheme();
    }
  }

  /** Get local preference that may need syncing to profile */
  getLocalPreference(): ThemeMode {
    return this.mode();
  }

  applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const theme = this.effectiveTheme();
    globalThis.document.documentElement.setAttribute('data-theme', theme);
  }
}
