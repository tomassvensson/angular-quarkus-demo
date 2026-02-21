import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { I18nService, Language, LANGUAGES } from '../services/i18n.service';

@Component({
  selector: 'app-language-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lang-selector" role="radiogroup" aria-label="Language selection">
      @for (lang of languages; track lang.code) {
        <button
          type="button"
          class="lang-btn"
          [class.active]="currentLang() === lang.code"
          [attr.aria-pressed]="currentLang() === lang.code"
          [attr.aria-label]="lang.label"
          [title]="lang.label"
          (click)="selectLanguage(lang.code)">
          <span class="lang-flag" aria-hidden="true">{{ lang.flag }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .lang-selector {
      display: inline-flex;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 0.55rem;
      overflow: hidden;
    }
    .lang-btn {
      background: transparent;
      border: none;
      color: white;
      padding: 0.3rem 0.4rem;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      transition: background 0.15s;
    }
    .lang-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .lang-btn.active {
      background: rgba(255, 255, 255, 0.25);
    }
    .lang-flag { pointer-events: none; }
  `]
})
export class LanguageSelectorComponent {
  private readonly i18n = inject(I18nService);

  readonly currentLang = computed(() => this.i18n.language());
  readonly languages = LANGUAGES;

  selectLanguage(lang: Language): void {
    this.i18n.setLanguage(lang);
  }
}
