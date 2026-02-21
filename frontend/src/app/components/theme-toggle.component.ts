import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { ThemeService, ThemeMode } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-toggle" role="radiogroup" aria-label="Theme preference">
      @for (option of options; track option.mode) {
        <button
          type="button"
          class="theme-btn"
          [class.active]="currentMode() === option.mode"
          [attr.aria-pressed]="currentMode() === option.mode"
          [attr.aria-label]="option.label"
          [title]="option.label"
          (click)="selectMode(option.mode)">
          <span class="theme-icon" aria-hidden="true">{{ option.icon }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .theme-toggle {
      display: inline-flex;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 0.55rem;
      overflow: hidden;
    }
    .theme-btn {
      background: transparent;
      border: none;
      color: white;
      padding: 0.3rem 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      transition: background 0.15s;
    }
    .theme-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .theme-btn.active {
      background: rgba(255, 255, 255, 0.25);
    }
    .theme-icon { pointer-events: none; }
  `]
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly currentMode = computed(() => this.themeService.mode());

  readonly options: Array<{ mode: ThemeMode; icon: string; label: string }> = [
    { mode: 'light', icon: '☀️', label: 'Light mode' },
    { mode: 'system', icon: '💻', label: 'System default' },
    { mode: 'dark', icon: '🌙', label: 'Dark mode' }
  ];

  selectMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }
}
