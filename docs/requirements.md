# Requirements Traceability

This document tracks all requirements identified across the project's conversation history, their implementation status, and related artifacts.

> **Last updated:** 2026-02-22

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Fully implemented and tested |
| ⚠️ | Partially implemented or needs improvement |
| ❌ | Not implemented |
| 📋 | Documented / assessment only |

---

## Core Application Features

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 1 | E2E tests for sign-in/logout flows | ✅ | Playwright tests in `e2e/` |
| 2 | AWS Cognito OIDC integration | ✅ | Backend OIDC with Cognito + Keycloak dev mode |
| 3 | Login callback / redirect after auth | ✅ | `LoginResource.java`, configurable redirect |
| 4 | Logout with session invalidation | ✅ | `LogoutResource.java` with `OidcSession.logout()` |
| 5 | Favicon (shield + lock icon) | ✅ | SVG favicon in `META-INF/resources` |
| 6 | Role-based UI (AdminUser / RegularUser) | ✅ | Menu visibility based on roles from JWT |
| 7 | User profile page | ✅ | `ProfilePageComponent` |
| 8 | Admin users list (paginated, sortable) | ✅ | `AdminUsersPageComponent` with cursor-based pagination |
| 9 | Admin user edit (roles, attributes) | ✅ | `UserEditPageComponent` |
| 10 | GraphQL API (versioned at `/api/v1/graphql`) | ✅ | `UserGraphQLApi`, `LinkGraphQLResource`, `SocialGraphQLResource`, `AuditGraphQLResource` |
| 11 | Angular SSR | ✅ | `app.config.server.ts`, `main.server.ts` |
| 12 | Disallowed username login policy | ✅ | `LoginPolicyService` with tests |
| 13 | 12-hour idle session extension | ✅ | OIDC session timeout configuration |
| 14 | Redirect on detected auth loss | ✅ | `ErrorInterceptor` redirects on 401 |
| 15 | Loading overlay for admin actions | ✅ | Loading state in admin user list |

## Link List Management

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 16 | CRUD for user's own link lists | ✅ | `MyListsComponent`, `LinkService` |
| 17 | View/manage individual list and links | ✅ | `ListDetailComponent` |
| 18 | Publish/unpublish lists | ✅ | GraphQL mutations, toggle in UI |
| 19 | Browse published lists (paginated) | ✅ | `PublicListsComponent` with pagination |
| 20 | Only owner can add/remove links/lists | ✅ | Backend authorization checks |
| 21 | Restrict published lists to authenticated users | ✅ | `@Authenticated` on `publishedLists` query |
| 22 | URL validation (comprehensive regex) | ✅ | `URL` API + regex for valid URLs |

## Social Features

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 23 | Star rating (1-5 stars, once per user/entity) | ✅ | `StarRatingComponent`, `VoteService`, `SocialGraphQLResource` |
| 24 | Display average rating (1 decimal) + star visualization | ✅ | Partial star fills, vote count display |
| 25 | Top-level comments on links and lists | ✅ | `CommentsSectionComponent`, `CommentService` |
| 26 | Reply to comments (owner + OP only) | ✅ | Backend authorization for replies |
| 27 | Comment editing (edit own comments) | ✅ | Edit button, `editComment` mutation |
| 28 | Delete comments (poster + admin) | ✅ | Delete with authorization checks |
| 29 | Notification bell with unread counter | ✅ | `NotificationBellComponent`, polling-based |
| 30 | Notification list (date desc, bold until read) | ✅ | `NotificationsPageComponent` with pagination |
| 31 | Notification detail (date, poster, item excerpt, message excerpt) | ✅ | Rich notification display |
| 32 | Click notification to navigate to source | ✅ | RouterLink to commented entity |
| 33 | Real-time notifications (WebSocket/SSE) | ❌ | Currently 30s polling; WebSocket upgrade recommended |
| 34 | Vote analytics / trending dashboard | ❌ | Not implemented |

## User Management & Authentication

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 35 | Change password from within app | ✅ | `ChangePasswordInput`, profile page |
| 36 | MFA device management (list, delete) | ✅ | `MfaSetupResponse`, profile page MFA section |
| 37 | Trusted device management | ✅ | `TrustedDevice` model, list/delete in profile |
| 38 | Add MFA device from within app | ✅ | TOTP setup flow in profile |
| 39 | MFA preferences (enable/disable) | ✅ | `MfaPreferenceInput`, preferences UI |
| 40 | Profile picture (upload, gravatar, OAuth provider) | ⚠️ | Model exists; S3/LocalStack storage needed (not filesystem) |
| 41 | Sign up and login with GitHub | ❌ | Cognito social IdP config documented but not wired |
| 42 | Sign up and login with Google | ❌ | Cognito social IdP config documented but not wired |
| 43 | Bot protection for production signup | 📋 | Documented recommendations, not implemented |
| 44 | Account deletion (self-service) | ✅ | Delete account button in profile page |

## UI/UX

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 45 | Dark mode / light mode / system setting | ✅ | `ThemeService`, `ThemeToggleComponent`, persisted per-user |
| 46 | Dark mode persistence across sessions | ✅ | Saved to user settings, restored on login |
| 47 | Internationalization (en, de, se) | ✅ | `I18nService`, all views have translation keys |
| 48 | Language selector with flag icons | ✅ | `LanguageSelectorComponent` |
| 49 | Display README.md on home page | ✅ | `ReadmeResource` + rendered in `HomePageComponent` |
| 50 | Pagination for lists > 10 items | ✅ | Cursor-based pagination on admin users, offset on public lists |
| 51 | Toast notifications for user actions | ✅ | `ToastService`, `ToastContainerComponent` |
| 52 | Global error handler / error boundary | ✅ | `GlobalErrorHandler`, catches unhandled errors → toast |
| 53 | Accessible (WCAG AA, ARIA, focus management) | ✅ | ARIA labels, keyboard navigation, i18n for all a11y strings |

## DevOps & CI/CD

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 54 | GitHub Actions CI (build + test) | ✅ | 7 workflows: backend-build, backend-tests, frontend-build, frontend-tests, e2e-tests, security, terraform-lint |
| 55 | LocalStack for local AWS dev | ✅ | `docker-compose.localstack.yml`, DynamoDB + Cognito |
| 56 | Keycloak for local auth dev | ✅ | `docker-compose.keycloak.yml`, realm config |
| 57 | Codecov integration | ✅ | Frontend + backend coverage uploaded |
| 58 | SonarCloud integration | ✅ | Frontend + backend quality gates |
| 59 | CodeQL scanning | ✅ | In security.yml workflow |
| 60 | Trivy filesystem scanning | ✅ | In security.yml workflow |
| 61 | DAST with OWASP ZAP | ✅ | Baseline scan in e2e-tests.yml after Playwright |
| 62 | Terraform IaC for AWS | ✅ | 4 modules (cognito, dynamodb, s3-cloudfront, ecs), 2 envs (dev, prod) |
| 63 | Terraform linting CI | ✅ | `terraform-lint.yml` with tflint + fmt/validate |
| 64 | API documentation (Swagger UI + GraphQL UI) | ✅ | `/q/swagger-ui`, `/q/graphql-ui` via SmallRye OpenAPI |
| 65 | Feature branch scans (SonarCloud, CodeQL) | ✅ | Workflows trigger on push to any branch + PRs |
| 66 | Seed data for manual testing | ✅ | `DataSeeder.java` populates sample data in dev mode |

## Logging & Monitoring

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 67 | Frontend log collection to CloudWatch | ✅ | `LogCollectorService` → `LogIngestionResource` → CloudWatch |
| 68 | Audit logging (who changed what, when) | ✅ | `AuditService`, `AuditGraphQLResource`, DynamoDB AuditLogs table |
| 69 | Health check endpoints | ✅ | Quarkus SmallRye Health at `/q/health` |

## Infrastructure Assessment

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 70 | DynamoDB assessment | 📋 | Full assessment in `docs/dynamodb-assessment.md` — 9 scan methods, 7 unused GSIs, critical scalability issues identified |
| 71 | Scalability review | 📋 | S3 for profile pictures (not filesystem), cursor-based pagination, GSI optimization recommended |

## Documentation

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 72 | README with architecture, tech stack, setup | ✅ | Comprehensive README.md with badges, screenshots, setup instructions |
| 73 | Technology version badges | ✅ | Angular, Quarkus, Java, TypeScript badges |
| 74 | SonarQube quality gate badges (sep. FE/BE) | ✅ | Separate frontend + backend badges |
| 75 | Badge organization (tech → FE → BE → integration) | ✅ | Organized by category |
| 76 | Requirements traceability | ✅ | This document |
| 77 | Terraform README | ✅ | `terraform/README.md` with architecture diagram |

## Code Quality

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 78 | SonarQube findings fixed | ✅ | Java S6204/S1192/S1104/S6813/S5786, TS S2933/S1128, GHA S6506/S7637 |
| 79 | Test coverage ≥ 81% | ⚠️ | Frontend ~85%+, Backend ~78% (E2E coverage not merged into SonarCloud) |
| 80 | ChangeDetectionStrategy.OnPush | ✅ | All components use OnPush |
| 81 | Standalone components (no NgModules) | ✅ | Angular 21 standalone by default |
| 82 | Signals for state management | ✅ | `signal()`, `computed()`, `input()`, `output()` |
| 83 | Cypress removal | ✅ | Removed, Playwright only |

---

## Not Implemented / Future Work

| # | Requirement | Reason |
|---|------------|--------|
| 33 | WebSocket/SSE real-time notifications | Architectural change — requires WebSocket backend support |
| 34 | Vote analytics / trending dashboard | Feature enhancement — lower priority |
| 40 | Profile picture S3 storage | Needs S3 bucket + presigned URL integration |
| 41 | GitHub social login | Requires Cognito IdP federation + Cognito Hosted UI or custom auth flow |
| 42 | Google social login | Same as GitHub — Cognito IdP federation required |
| 43 | Bot protection | Production-only concern — WAF + Cognito Advanced Security |
| 70 | DynamoDB optimization (wire up GSIs) | Documented in assessment — significant refactor of all service classes |
