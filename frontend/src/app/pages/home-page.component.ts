import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
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
    </section>
  `
})
export class HomePageComponent {}
