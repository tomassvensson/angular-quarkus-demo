import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SocialService } from '../services/social.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      @if (readmeHtml()) {
        <div class="markdown-body" [innerHTML]="readmeHtml()"></div>
      } @else if (loading()) {
        <div class="hero-card">
          <p class="muted">{{ i18n.t('home.loadingReadme') }}</p>
        </div>
      } @else {
        <div class="hero-card">
          <h1>{{ i18n.t('home.welcome') }}</h1>
          <p class="muted">
            {{ i18n.t('home.description') }}
          </p>
          <p class="muted">
            {{ i18n.t('home.menuHint') }}
          </p>
        </div>

        <h3 class="section-title">{{ i18n.t('home.techTitle') }}</h3>
        <div class="tech-list">
          <span class="tech-pill">Angular</span>
          <span class="tech-pill">TypeScript</span>
          <span class="tech-pill">Quarkus</span>
          <span class="tech-pill">Java</span>
          <span class="tech-pill">GraphQL</span>
          <span class="tech-pill">AWS Cognito</span>
          <span class="tech-pill">Playwright</span>
        </div>

        <div class="info-callout">
          <strong>{{ i18n.t('home.tip') }}:</strong> {{ i18n.t('home.tipText') }}
        </div>
      }
    </section>
  `,
  styles: [`
    .markdown-body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-text);
      word-wrap: break-word;
    }
    .markdown-body h1 {
      font-size: 2rem;
      font-weight: 700;
      border-bottom: 1px solid var(--color-card-border);
      padding-bottom: 0.5rem;
      margin: 1.5rem 0 1rem;
    }
    .markdown-body h2 {
      font-size: 1.5rem;
      font-weight: 600;
      border-bottom: 1px solid var(--color-card-border);
      padding-bottom: 0.3rem;
      margin: 1.25rem 0 0.75rem;
    }
    .markdown-body h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem;
    }
    .markdown-body p { margin: 0.5rem 0; }
    .markdown-body ul, .markdown-body ol {
      padding-left: 2rem;
      margin: 0.5rem 0;
    }
    .markdown-body li { margin: 0.25rem 0; }
    .markdown-body code {
      background: var(--color-row-even);
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.85em;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    }
    .markdown-body pre {
      background: var(--color-text);
      color: var(--color-bg);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 0.75rem 0;
    }
    .markdown-body pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.75rem 0;
    }
    .markdown-body th, .markdown-body td {
      border: 1px solid var(--color-card-border);
      padding: 0.4rem 0.75rem;
      text-align: left;
    }
    .markdown-body th {
      background: var(--color-row-even);
      font-weight: 600;
    }
    .markdown-body blockquote {
      border-left: 4px solid var(--color-panel-border);
      padding: 0.25rem 1rem;
      color: var(--color-text-muted);
      margin: 0.75rem 0;
    }
    .markdown-body a {
      color: var(--color-link);
      text-decoration: none;
    }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body img {
      max-width: 100%;
      border-radius: 0.5rem;
      margin: 0.5rem 0;
    }
    .markdown-body strong { font-weight: 600; }
    .markdown-body hr {
      border: none;
      border-top: 1px solid var(--color-card-border);
      margin: 1.5rem 0;
    }
  `]
})
export class HomePageComponent implements OnInit {
  private readonly socialService = inject(SocialService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly i18n = inject(I18nService);

  readonly readmeHtml = signal<string | null>(null);
  readonly loading = signal(false);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading.set(true);
    this.socialService.getReadme().subscribe({
      next: (markdown) => {
        void this.renderMarkdown(markdown);
      },
      error: () => this.loading.set(false)
    });
  }

  private async renderMarkdown(markdown: string): Promise<void> {
    try {
      const { marked } = await import('marked');
      const html = await marked(markdown, { async: true });
      // Rewrite relative image paths to GitHub raw URLs
      const processedHtml = html.replaceAll(
        /src="(?!https?:\/\/)(docs\/[^"]+)"/g,
        'src="https://raw.githubusercontent.com/tomassvensson/angular-quarkus-demo/main/$1"'
      );
      this.readmeHtml.set(processedHtml);
    } finally {
      this.loading.set(false);
    }
  }
}
