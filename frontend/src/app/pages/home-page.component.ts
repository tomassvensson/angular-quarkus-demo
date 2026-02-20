import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SocialService } from '../services/social.service';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      @if (readmeHtml()) {
        <div class="markdown-body" [innerHTML]="readmeHtml()"></div>
      } @else if (loading()) {
        <div class="hero-card">
          <p class="muted">Loading README...</p>
        </div>
      } @else {
        <div class="hero-card">
          <h1>Welcome</h1>
          <p class="muted">
            This Angular app uses the Quarkus backend for authentication and API access.
          </p>
          <p class="muted">
            Use the top menu to sign in/sign out. Admin users will see the <strong>List Users</strong> menu item.
          </p>
        </div>

        <h3 class="section-title">Technologies Used</h3>
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
          <strong>Tip:</strong> Once signed in as <em>AdminUser</em>, open <em>List Users</em> to sort, page,
          and edit group membership.
        </div>
      }
    </section>
  `,
  styles: [`
    .markdown-body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      word-wrap: break-word;
    }
    .markdown-body h1 {
      font-size: 2rem;
      font-weight: 700;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 0.5rem;
      margin: 1.5rem 0 1rem;
    }
    .markdown-body h2 {
      font-size: 1.5rem;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
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
      background: #f3f4f6;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.85em;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    }
    .markdown-body pre {
      background: #1f2937;
      color: #e5e7eb;
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
      border: 1px solid #d1d5db;
      padding: 0.4rem 0.75rem;
      text-align: left;
    }
    .markdown-body th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .markdown-body blockquote {
      border-left: 4px solid #dbeafe;
      padding: 0.25rem 1rem;
      color: #4b5563;
      margin: 0.75rem 0;
    }
    .markdown-body a {
      color: #2563eb;
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
      border-top: 1px solid #e5e7eb;
      margin: 1.5rem 0;
    }
  `]
})
export class HomePageComponent implements OnInit {
  private readonly socialService = inject(SocialService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  readonly readmeHtml = signal<SafeHtml | null>(null);
  readonly loading = signal(false);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading.set(true);
    this.socialService.getReadme().subscribe({
      next: async (markdown) => {
        const { marked } = await import('marked');
        const html = await marked(markdown, { async: true });
        // Rewrite relative image paths to GitHub raw URLs
        const processedHtml = html.replace(
          /src="(?!https?:\/\/)(docs\/[^"]+)"/g,
          'src="https://raw.githubusercontent.com/tomassvensson/angular-quarkus-demo/main/$1"'
        );
        this.readmeHtml.set(this.sanitizer.bypassSecurityTrustHtml(processedHtml));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
