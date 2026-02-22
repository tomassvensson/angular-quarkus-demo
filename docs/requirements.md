# Requirements Traceability

This document tracks **every** requirement identified across the project's conversation history, their implementation status, and related artifacts.

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

## Category 1 — Authentication & Session Management

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 1 | E2E tests for sign-in/logout flows | 2026-02-12 | ✅ | Playwright tests in `e2e/homepage.spec.ts`, `e2e/lists.spec.ts` |
| 2 | AWS Cognito OIDC integration | 2026-02-12 | ✅ | Backend OIDC config in `application.properties`, Cognito SDK in `CognitoAdminService` |
| 3 | Fix login 404 / callback redirect | 2026-02-12 16:40 | ✅ | `LoginResource.java` handles post-auth redirect |
| 4 | Fix logout 400 / session invalidation | 2026-02-12 16:40 | ✅ | `LogoutResource.java` with `OidcSession.logout()` |
| 5 | Fix logout not clearing session (OidcSession.logout) | 2026-02-12 17:20 | ✅ | Replaced manual cookie deletion with proper OIDC logout |
| 6 | 12-hour idle session extension | 2026-02-13 10:03 | ✅ | `quarkus.oidc.authentication.session-age-extension=12H` in `application.properties` |
| 7 | Redirect on detected auth loss (401) | 2026-02-13 10:03 | ✅ | `ErrorInterceptor` in `frontend/src/app/interceptors/error.interceptor.ts` |
| 8 | Disallowed username login policy | 2026-02-13 10:03 | ✅ | `LoginPolicyService.java` + `LoginPolicyServiceTest.java` |
| 9 | Fix encryption secret warning on startup | 2026-02-14 19:34 | ✅ | `quarkus.oidc.token-state-manager.encryption-secret` set, override via `.env` |
| 10 | Optional MFA in AWS Cognito (no app change needed) | 2026-02-14 19:48 | ✅ | Confirmed: pure Cognito setting, no app change needed |
| 11 | Password change/reset from within app | 2026-02-21 09:00 | ✅ | `ChangePasswordInput` model, `changePassword` mutation, profile page UI with i18n in en/de/se |
| 12 | MFA device listing and deletion | 2026-02-21 09:00 | ✅ | `TrustedDevice` model, `listTrustedDevices`/`forgetDevice` in `CognitoAdminService`, profile page MFA section |
| 13 | Trusted device management (list/delete) | 2026-02-21 09:00 | ✅ | Keycloak mock paths + Cognito SDK paths, profile page UI |
| 14 | Add MFA device (TOTP setup) from within app | 2026-02-21 09:00 | ✅ | `setupTotp`/`verifyTotp` in `CognitoAdminService`, QR code display in profile |
| 15 | MFA preferences (enable/disable TOTP/SMS) | 2026-02-21 09:00 | ✅ | `MfaPreferenceInput`, `setMfaPreference` mutation, profile page preferences UI |
| 16 | Sign up and login with GitHub | 2026-02-21 09:00 | ❌ | Requires Cognito social IdP federation + hosted UI or custom auth flow; not wired |
| 17 | Sign up and login with Google | 2026-02-21 09:00 | ❌ | Same as GitHub — Cognito IdP federation required; not wired |
| 18 | Bot protection for production signup | 2026-02-21 13:00 | 📋 | Documented recommendations (WAF, Cognito Advanced Security); not implemented |
| 19 | Account deletion (self-service) | 2026-02-21 09:00 | ✅ | `deleteAccount` in profile page, GraphQL mutation, i18n in en/de/se |
| 20 | Cognito/Keycloak provider switch for local dev vs prod | 2026-02-19 13:00 | ✅ | `isKeycloakMode()` in `CognitoAdminService`, `auth.provider` config property |
| 21 | Fix logout 400 (post_logout_redirect_uri not allowed) | 2026-02-17 10:50 | ✅ | `LogoutResource.java` updated |

---

## Category 2 — Link List Management

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 22 | CRUD for user's own link lists | 2026-02-12 20:03 | ✅ | `MyListsComponent`, `LinkService`, `LinkGraphQLResource` |
| 23 | View/manage individual list and links | 2026-02-12 20:03 | ✅ | `ListDetailComponent` |
| 24 | Publish/unpublish lists | 2026-02-12 20:03 | ✅ | GraphQL mutations, toggle in UI |
| 25 | Browse published lists (paginated) | 2026-02-12 20:03 | ✅ | `PublicListsComponent` with offset pagination via `PublishedListsPage` |
| 26 | Only owner can add/remove links/lists | 2026-02-17 17:55 | ✅ | Backend authorization checks in `LinkGraphQLResource` |
| 27 | Restrict published lists to authenticated users | 2026-02-17 10:50 | ✅ | `@Authenticated` on `LinkGraphQLResource` and `publishedLists` query |
| 28 | URL validation (comprehensive regex + URL API) | 2026-02-21 09:00 | ✅ | `URL` API + regex; i18n validation messages for invalid URL/domain/protocol |
| 29 | Fix CreateList mutation 404 | 2026-02-17 10:50 | ✅ | GraphQL endpoint routing fixed |
| 30 | Pagination for lists > 10 items | 2026-02-19 13:00 | ✅ | Offset pagination on public lists, cursor-based on admin users |
| 31 | Cursor-based pagination for listUsers | 2026-02-22 09:00 | ✅ | `CognitoAdminService` uses `paginationToken` for cursor-based paginated listing |

---

## Category 3 — Social Features

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 32 | Star rating (1–5 stars, once per user/entity) | 2026-02-20 17:00 | ✅ | `StarRatingComponent`, `VoteService`, `SocialGraphQLResource`, `Vote` model |
| 33 | Display average rating (1 decimal) + partial star visualization | 2026-02-20 17:00 | ✅ | Partial star fills (yellow), `VoteStats` model |
| 34 | Top-level comments on links and lists | 2026-02-20 17:00 | ✅ | `CommentsSectionComponent`, `CommentService`, `Comment` model |
| 35 | Reply to comments (owner + OP only) | 2026-02-20 17:00 | ✅ | Backend authorization for replies in `SocialGraphQLResource` |
| 36 | Comment editing (edit own comments) | 2026-02-21 09:00 | ✅ | `editComment` mutation, `canEdit`/`startEdit`/`saveEdit` in `CommentsSectionComponent` |
| 37 | Delete comments (poster + admin) | 2026-02-20 17:00 | ✅ | Delete with authorization checks |
| 38 | Notification bell with unread counter | 2026-02-20 17:00 | ✅ | `NotificationBellComponent`, polling-based (30s interval) |
| 39 | Notification list (date desc, bold until read) | 2026-02-20 17:00 | ✅ | `NotificationsPageComponent` with pagination |
| 40 | Notification detail (date, poster, item excerpt, message excerpt) | 2026-02-20 17:00 | ✅ | Rich notification display with i18n |
| 41 | Click notification to navigate to source | 2026-02-20 17:00 | ✅ | RouterLink to commented entity |
| 42 | Real-time notifications (WebSocket/SSE) | 2026-02-21 09:00 | ❌ | Currently 30s polling; no WebSocket/SSE backend support implemented |
| 43 | Vote analytics / trending dashboard | 2026-02-21 09:00 | ❌ | Not implemented; lower priority feature enhancement |
| 44 | E2E tests for social features (voting, comments, notifications) | 2026-02-21 09:00 | ⚠️ | `e2e/lists.spec.ts` mocks GraphQL responses for votes/comments/notifications but does not exercise full social interaction flows |

---

## Category 4 — User Interface & Experience

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 45 | Favicon (shield + lock icon) | 2026-02-12 17:20 | ✅ | SVG favicon in `META-INF/resources` |
| 46 | Role-based UI (AdminUser / RegularUser menu visibility) | 2026-02-12 18:27 | ✅ | Menu visibility based on roles from JWT |
| 47 | Display user groups on home page | 2026-02-12 | ✅ | Status bar shows roles |
| 48 | Fix roles in status bar / propagation to frontend `me` query | 2026-02-14 19:20 | ✅ | Correct role names (AdminUser/RegularUser) in mock service + Keycloak config |
| 49 | Admin users list (paginated, sortable, zebra rows) | 2026-02-12 20:03 | ✅ | `AdminUsersPageComponent` with cursor-based pagination, sorting, striped rows |
| 50 | Admin user edit (roles, attributes, group multiselect) | 2026-02-12 20:03 | ✅ | `UserEditPageComponent` |
| 51 | Loading overlay for admin list actions | 2026-02-13 10:03 | ✅ | Loading state in admin user list during sort/pagination |
| 52 | Colorful styling for home/details/table views | 2026-02-13 10:03 | ✅ | Global styles via `src/styles.css` |
| 53 | Make routed-page styling global | 2026-02-13 10:11 | ✅ | `src/styles.css` import |
| 54 | Dark mode / light mode / system setting with icons | 2026-02-21 09:00 | ✅ | `ThemeService`, `ThemeToggleComponent` (☀️/🌙/🖥️ icons), dark/light/system modes |
| 55 | Dark mode persistence across sessions | 2026-02-21 09:00 | ⚠️ | Persisted to `localStorage` + `syncFromProfile()` hook exists; **no backend user-settings table** to persist across devices. Requirement says "stored in user profile in Cognito/Keycloak or DynamoDB user settings table" — only localStorage used currently |
| 56 | Internationalization (en, de, se) | 2026-02-21 09:00 | ✅ | `I18nService` with complete translations for all 3 languages across all views |
| 57 | Language selector with color flag icons | 2026-02-21 09:00 | ✅ | `LanguageSelectorComponent` |
| 58 | i18n completeness — verify all views have translation keys | 2026-02-22 09:00 | ✅ | All pages/components inject `I18nService`, all user-facing strings have translation keys in en/de/se |
| 59 | Display README.md on home page | 2026-02-20 17:00 | ✅ | `ReadmeResource` serves `/api/v1/readme`, `HomePageComponent` renders it |
| 60 | Toast notifications for user actions | 2026-02-19 13:00 | ✅ | `ToastService`, `ToastContainerComponent` |
| 61 | Global error handler / error boundary | 2026-02-19 13:00 | ✅ | `GlobalErrorHandler` catches unhandled errors → toast |
| 62 | Accessible (WCAG AA, ARIA, focus management) | 2026-02-19 13:00 | ✅ | ARIA labels, keyboard navigation, a11y i18n strings |
| 63 | Dark mode in all views and pages | 2026-02-21 09:00 | ✅ | `data-theme` attribute on document root, CSS variables applied globally |
| 64 | i18n persistence to user profile (same as dark mode) | 2026-02-21 09:00 | ⚠️ | Language persisted to `localStorage` only; no backend user-settings table. Requirement says setting should be handled same as dark mode (stored in profile) |
| 65 | Default language from browser, defaulting to English | 2026-02-21 09:00 | ✅ | `I18nService` detects browser language (`navigator.language`), defaults to English |

---

## Category 5 — Profile & User Settings

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 66 | User profile page | 2026-02-13 08:38 | ✅ | `ProfilePageComponent` with username, email, roles |
| 67 | Profile picture upload (50×50 max, S3/LocalStack storage) | 2026-02-21 09:00 | ⚠️ | Model/concept may exist but **no S3 presigned URL integration**, no upload endpoint in backend. Prompt #2026-02-21 13:00 explicitly said "should use S3/LocalStack, not local filesystem" |
| 68 | Profile picture from Gravatar (default) | 2026-02-21 09:00 | ❌ | No Gravatar integration found in frontend or backend |
| 69 | Profile picture from OAuth2/OIDC provider | 2026-02-21 09:00 | ❌ | No OIDC profile picture extraction found |
| 70 | Profile picture source switching (gravatar/uploaded/OIDC) | 2026-02-21 09:00 | ❌ | No source-switching logic found |
| 71 | Profile pictures displayed next to comments and admin lists | 2026-02-21 09:00 | ❌ | No avatar rendering in `CommentsSectionComponent` or `AdminUsersPageComponent` |
| 72 | User settings table in DynamoDB | 2026-02-21 09:00 | ❌ | No `UserSettings` model or DynamoDB table found in backend. Theme/language only in localStorage |
| 73 | Pre-login theme change synced to profile after login | 2026-02-21 09:00 | ⚠️ | `syncFromProfile()` and `getLocalPreference()` hooks exist, but no backend endpoint to save/load user settings |

---

## Category 6 — Admin & API Features

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 74 | GraphQL API (versioned at `/api/v1/graphql`) | 2026-02-12 20:03 | ✅ | `UserGraphQLApi`, `LinkGraphQLResource`, `SocialGraphQLResource`, `AuditGraphQLResource` |
| 75 | GraphQL smoke tests | 2026-02-12 20:12 | ✅ | `GraphqlSmokeTest.java` |
| 76 | Angular SSR (server-side rendering) | 2026-02-13 08:14 | ✅ | `app.config.server.ts`, `main.server.ts`, SSR timeout fix for browser-only GraphQL |

---

## Category 7 — DevOps & CI/CD

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 77 | GitHub Actions CI (build + test for frontend + backend) | 2026-02-13 14:16 | ✅ | 7 workflows: `backend-build.yml`, `backend-tests.yml`, `frontend-build.yml`, `frontend-tests.yml`, `e2e-tests.yml`, `security.yml`, `terraform-lint.yml` |
| 78 | Split CI into five+ workflow badges | 2026-02-13 14:31 | ✅ | Separate badges for FE build, FE tests, BE build, BE tests, E2E, security, CodeQL, Codecov |
| 79 | Fix backend CI failures (Cognito SDK builder, docker-compose) | 2026-02-13 15:09 | ✅ | Fixed |
| 80 | Fix backend-tests workflow (AWS CLI setup) | 2026-02-13 15:29 | ✅ | Uses ubuntu runner's built-in AWS CLI v2 |
| 81 | Fix ssm list-parameters → describe-parameters | 2026-02-13 15:46 | ✅ | Fixed |
| 82 | Fix README badge URLs (replace placeholders) | 2026-02-13 15:46 | ✅ | `tomassvensson/angular-quarkus-demo` |
| 83 | LocalStack for local AWS dev (DynamoDB + Cognito) | 2026-02-13 14:16 | ✅ | `.github/localstack/docker-compose.localstack.yml`, `seed-localstack.sh` |
| 84 | Keycloak for local auth dev | 2026-02-13 14:16 | ✅ | `.github/keycloak/docker-compose.keycloak.yml`, `realm-export.json` |
| 85 | Pin LocalStack to 3.8 | 2026-02-19 13:00 | ✅ | In docker-compose |
| 86 | Codecov integration | 2026-02-14 19:48 | ✅ | Frontend + backend coverage uploaded via `codecov-action` |
| 87 | SonarCloud integration (separate FE + BE projects) | 2026-02-19 15:00 | ✅ | `tomassvensson_angular-quarkus-demo-frontend` + `tomassvensson_angular-quarkus-demo-backend` |
| 88 | CodeQL scanning (SAST) | 2026-02-19 13:00 | ⚠️ | Referenced in README badge (`codeql.yml`) and documented, but **no `codeql.yml` workflow file found locally** — may exist on GitHub only or configured via GitHub UI |
| 89 | Trivy filesystem scanning | 2026-02-19 13:00 | ✅ | In `security.yml` + `trivy.yaml` config |
| 90 | DAST with OWASP ZAP during E2E | 2026-02-22 09:00 | ✅ | `e2e-tests.yml` includes `zaproxy/action-baseline` step with rules file at `.github/zap/rules.tsv` |
| 91 | Feature branch scans (SonarCloud, CodeQL) on push | 2026-02-21 09:00 | ✅ | Workflows trigger on push to any branch + PRs |
| 92 | Collect browser console warnings/errors during E2E | 2026-02-19 15:00 | ✅ | `console-collector.fixture.ts` collects console errors/warnings, used in all E2E specs |
| 93 | Security scanning before pushing (local Trivy, SonarQube) | 2026-02-19 13:00 | ✅ | `scripts/security-scan.ps1`, `scripts/security-scan.sh`, documented in copilot-instructions |
| 94 | E2E test coverage in SonarCloud/Codecov | 2026-02-20 09:00 | ⚠️ | `jacoco-quarkus.exec` generated; JaCoCo report at `target/jacoco-report/`; but E2E coverage not merged into SonarCloud quality gate (SonarCloud sees 0% on new code) |
| 95 | Fix SonarCloud Quality Gate (coverage on new code) | 2026-02-19 16:15 | ⚠️ | Backend JaCoCo XML and frontend LCOV configured, but Quality Gate may still fail for 0% on new code if E2E coverage not included |

---

## Category 8 — Infrastructure & Terraform

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 96 | Terraform IaC for AWS (Cognito, DynamoDB, S3, CloudFront, ECS) | 2026-02-22 09:00 | ✅ | 4 modules (`cognito`, `dynamodb`, `s3-cloudfront`, `ecs`), 2 envs (`dev`, `prod`) |
| 97 | Terraform linting CI | 2026-02-22 09:00 | ✅ | `terraform-lint.yml` with tflint + fmt/validate |
| 98 | Terraform README | 2026-02-22 09:00 | ✅ | `terraform/README.md` |
| 99 | Terraform linting/static analysis | 2026-02-22 09:00 | ✅ | tflint in CI |

---

## Category 9 — Logging & Monitoring

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 100 | Frontend log collection to CloudWatch/LocalStack | 2026-02-19 13:00 | ✅ | `LogCollectorService` → `LogIngestionResource` → `CloudWatchLogService` |
| 101 | Audit logging (who changed what, when) | 2026-02-22 09:00 | ✅ | `AuditService`, `AuditGraphQLResource`, `AuditLog` model, DynamoDB `AuditLogs` table |
| 102 | Health check endpoints | 2026-02-19 13:00 | ✅ | `quarkus-smallrye-health` at `/q/health`, `/q/health/live`, `/q/health/ready` |

---

## Category 10 — API & Documentation

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 103 | API documentation (Swagger UI + GraphQL UI) | 2026-02-22 09:00 | ✅ | `/q/swagger-ui` (SmallRye OpenAPI), `/q/graphql-ui` (SmallRye GraphQL) |
| 104 | README with architecture, tech stack, setup | 2026-02-13 10:30 | ✅ | Comprehensive `README.md` with badges, architecture, screenshots, setup instructions |
| 105 | Technology version badges (Angular, Quarkus, Java, etc.) | 2026-02-20 09:00 | ✅ | Angular 21, Quarkus 3.31, Java 21, TypeScript 5.x, DynamoDB, Cognito, GraphQL |
| 106 | SonarQube quality gate badges (separate FE/BE) | 2026-02-20 09:00 | ✅ | Separate frontend + backend SonarCloud badges |
| 107 | Badge text "SonarQube quality gate" (not just "quality gate") | 2026-02-21 09:00 | ✅ | Badge text reads "SonarQube Quality Gate (Frontend)" / "(Backend)" |
| 108 | Badge organization (tech → FE → BE → integration) | 2026-02-20 09:00 | ✅ | Technologies first, then Frontend, Backend, Integration & Security rows |
| 109 | Code coverage badge | 2026-02-20 09:00 | ✅ | Codecov badge + SonarCloud coverage badges for FE and BE |
| 110 | CodeQL mentioned in README | 2026-02-22 17:00 | ✅ | CodeQL badge, description in Security section, architecture reference |
| 111 | README screenshots | 2026-02-13 14:31 | ⚠️ | 3 screenshots exist (`login-screen.png`, `role-based-menu.png`, `admin-user-management-view.png`); prompt #2026-02-21 09:00 requested updating/increasing screenshots — may not reflect current UI state with dark mode, i18n, social features |
| 112 | DynamoDB assessment document | 2026-02-22 09:00 | ✅ | `docs/dynamodb-assessment.md` — scan methods, unused GSIs, scalability issues |
| 113 | Requirements traceability document | 2026-02-22 09:00 | ✅ | This document |
| 114 | Seed data for manual testing | 2026-02-22 09:00 | ✅ | `DataSeeder.java` populates sample data in dev mode when `app.seed-data=true` |

---

## Category 11 — Code Quality & SonarQube

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 115 | Fix SonarQube findings (Java: S6204, S1192, S1104, S6813, S5786) | 2026-02-17 18:28 | ✅ | Fixed across multiple commits |
| 116 | Fix SonarQube findings (TS: S2933, S1128, S5332, S7764) | 2026-02-17 18:28 | ✅ | Fixed |
| 117 | Fix SonarQube findings (GHA: S7637, S6506, S6505) | 2026-02-17 18:35 | ✅ | Pinned action SHAs, fixed npm ci findings |
| 118 | Fix CodeQL: Incomplete multi-character sanitization | 2026-02-19 15:00 | ✅ | Fixed in `my-lists.component.ts` and `list-detail.component.ts` |
| 119 | Fix SonarCloud Security Hotspots (regex S5852) | 2026-02-19 16:15 | ✅ | Fixed super-linear runtime in `sanitize()` functions |
| 120 | Fix SonarQube S5605 (npm ci), S5606 (curl redirect), S5725 (Tailwind CDN SRI) | 2026-02-20 09:00 | ✅ | Security workflow findings addressed |
| 121 | Fix duplicated "COMMENT" literal | 2026-02-22 16:00 | ✅ | Extracted to constant |
| 122 | Fix unused imports in test files | 2026-02-22 16:00 | ✅ | Cleaned up |
| 123 | Fix raw type warnings in Java | 2026-02-22 16:00 | ✅ | Parameterized types |
| 124 | Fix README markdown linting (MD007/MD029/MD032) | 2026-02-22 16:00 | ✅ | Fixed |
| 125 | Test coverage ≥ 81% (frontend + backend) | copilot-instructions | ⚠️ | Frontend ~85%+; Backend ~78% on SonarCloud (E2E coverage not merged). Requirement target is 81% for both |
| 126 | ChangeDetectionStrategy.OnPush on all components | 2026-02-19 13:00 | ✅ | All components confirmed to use `OnPush` |
| 127 | Standalone components (no NgModules) | copilot-instructions | ✅ | Angular 21 standalone by default |
| 128 | Signals for state management | copilot-instructions | ✅ | `signal()`, `computed()`, `input()`, `output()` used throughout |
| 129 | Error handling interceptor | 2026-02-19 13:00 | ✅ | `error.interceptor.ts` + `global-error-handler.ts` |
| 130 | CORS configuration | 2026-02-19 13:00 | ✅ | Explicit CORS in `application.properties` (origins, methods, headers, credentials) |

---

## Category 12 — Cleanup & Refactoring

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 131 | Remove Cypress if not being used | 2026-02-21 09:00 | ✅ | Cypress files fully removed; Playwright is the sole E2E framework |
| 132 | Check if /hello endpoint is needed / remove unused endpoints | 2026-02-21 13:00 | ⚠️ | `HomeResource.java` still exists (serves Qute template at `/`). The `/hello` endpoint may have been removed but `HomeResource` remains. No `/hello` path found |
| 133 | Remove unused dependencies (pom.xml, package.json) | copilot-instructions | ⚠️ | End-procedure item; should be audited |
| 134 | Fix main branch checks failing after merge | 2026-02-21 13:00 | ⚠️ | Recurring issue; process gap identified — need CI checks on main branch after merge |

---

## Category 13 — Testing

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 135 | Playwright E2E tests for homepage | 2026-02-13 08:14 | ✅ | `e2e/homepage.spec.ts` |
| 136 | E2E tests for lists flow | 2026-02-19 15:00 | ✅ | `e2e/lists.spec.ts` |
| 137 | Screenshots E2E test | 2026-02-13 14:31 | ✅ | `e2e/readme-screenshots.spec.ts` |
| 138 | Backend integration tests (LinkService with DynamoDB/Testcontainers) | 2026-02-19 13:00 | ✅ | `LinkServiceIntegrationTest.java` |
| 139 | Backend unit tests for CloudWatchLogService | 2026-02-19 13:00 | ✅ | `CloudWatchLogServiceTest.java` |
| 140 | Backend unit tests for AuditService | 2026-02-22 09:00 | ✅ | `AuditServiceTest.java` |
| 141 | Backend unit tests for DataSeeder | 2026-02-22 09:00 | ✅ | `DataSeederTest.java` |
| 142 | Backend unit tests for CognitoAdminService | 2026-02-19 13:00 | ✅ | `CognitoAdminServiceTest.java` |
| 143 | Frontend unit tests for all components/services | 2026-02-19 13:00 | ✅ | `.spec.ts` files exist for all components and services (23 spec files total) |
| 144 | Add test that fails without fix, passes with fix (for bug reports) | copilot-instructions | ✅ | Applied across various bug fixes |
| 145 | Fix frontend test failures on GitHub | 2026-02-14 19:34 | ✅ | Fixed Jasmine errors |
| 146 | Add @types/node to Playwright tsconfig | 2026-02-19 13:00 | ✅ | `tsconfig.e2e.json` |
| 147 | Run all tests locally (npm test, mvn test) | 2026-02-17 10:50 | ✅ | Documented commands in copilot-instructions |

---

## Category 14 — Scalability & Architecture

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 148 | Profile pictures should use S3, not filesystem | 2026-02-21 13:00 | ❌ | No S3 bucket or presigned URL integration. Prompt was explicit about this |
| 149 | Scalability review / recommendations | 2026-02-21 13:00 | 📋 | Documented: S3 for profile pics, cursor-based pagination, GSI optimization |
| 150 | DynamoDB assessment (right choice for lists/links) | 2026-02-22 09:00 | 📋 | Full assessment in `docs/dynamodb-assessment.md` |
| 151 | DynamoDB optimization (wire up GSIs, fix scan methods) | 2026-02-22 09:00 | 📋 | 9 scan methods and 7 unused GSIs identified; significant refactor needed |

---

## Category 15 — Prompt 2026-02-22 Requirements

| ID | Requirement | Prompt Date | Status | Notes |
|----|------------|-------------|--------|-------|
| 152 | DAST/IAST during E2E tests | 2026-02-22 09:00 | ✅ | OWASP ZAP baseline scan in `e2e-tests.yml` |
| 153 | Pagination optimization — cursor-based for listUsers | 2026-02-22 09:00 | ✅ | Already using cursor-based in `CognitoAdminService` |
| 154 | Dark mode persistence across session refresh | 2026-02-22 09:00 | ⚠️ | LocalStorage only; not persisted to backend user profile |
| 155 | i18n completeness — all views have translation keys | 2026-02-22 09:00 | ✅ | Verified: all pages/components use `I18nService`, complete en/de/se translations |
| 156 | API documentation — GraphQL schema docs and Swagger | 2026-02-22 09:00 | ✅ | `/q/swagger-ui`, `/q/graphql-ui` |
| 157 | Terraform IaC for AWS | 2026-02-22 09:00 | ✅ | Full module structure |
| 158 | Angular error boundary / global error handler | 2026-02-22 09:00 | ✅ | `GlobalErrorHandler` |
| 159 | Audit logging — who changed what, when | 2026-02-22 09:00 | ✅ | `AuditService` + `AuditGraphQLResource` |
| 160 | Terraform linting/static analysis | 2026-02-22 09:00 | ✅ | tflint in `terraform-lint.yml` |
| 161 | Seed data for manual testing | 2026-02-22 09:00 | ✅ | `DataSeeder.java` |
| 162 | DAST and IAST suggestions for fixes | 2026-02-22 17:00 | 📋 | ZAP report generated as artifact; fix suggestions provided in conversation |
| 163 | Requirements table from entire conversation | 2026-02-22 17:00 | ✅ | This document |

---

## Not Implemented / Future Work Summary

| ID | Requirement | Reason |
|----|------------|--------|
| 16 | GitHub social login | Requires Cognito IdP federation + Cognito Hosted UI or custom auth flow |
| 17 | Google social login | Same as GitHub — Cognito IdP federation required |
| 18 | Bot protection | Production-only concern — WAF + Cognito Advanced Security (documented) |
| 42 | WebSocket/SSE real-time notifications | Architectural change — requires WebSocket backend support (Quarkus WebSockets Next) |
| 43 | Vote analytics / trending dashboard | Feature enhancement — lower priority |
| 67 | Profile picture upload (S3) | Needs S3 bucket + presigned URL integration + backend upload endpoint |
| 68 | Profile picture from Gravatar | Not implemented |
| 69 | Profile picture from OAuth2/OIDC | Not implemented |
| 70 | Profile picture source switching | Not implemented (depends on 67–69) |
| 71 | Profile pictures in comments/admin | Not implemented (depends on 67–70) |
| 72 | User settings DynamoDB table | Theme/language only in localStorage; no backend persistence |
| 148 | S3 storage for profile pictures | No S3 integration for user uploads |
| 151 | DynamoDB GSI optimization | Documented assessment only; significant refactor needed |

---

## Partially Implemented Summary

| ID | Requirement | What's Missing |
|----|------------|---------------|
| 44 | E2E tests for social features | Only mock-based; no full interaction flow tests |
| 55 | Dark mode persistence to backend | `syncFromProfile()` hook exists but no backend user-settings API |
| 64 | i18n persistence to backend | Same as dark mode — localStorage only |
| 73 | Pre-login theme sync to profile | Hooks exist but no save endpoint |
| 88 | CodeQL scanning | README references `codeql.yml` but file not found locally |
| 94 | E2E test coverage in SonarCloud | JaCoCo exec file generated but not merged into SonarCloud gate |
| 95 | SonarCloud Quality Gate (coverage) | May still fail for 0% on new code |
| 111 | README screenshots | Only 3 screenshots; don't reflect dark mode, i18n, social features |
| 125 | Test coverage ≥ 81% | Frontend OK (~85%+); Backend at ~78% — needs E2E coverage merge |
| 134 | Main branch CI stability | Recurring post-merge failures; process gap |
