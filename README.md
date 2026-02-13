# Angular + Quarkus + AWS Cognito Demo

[![Backend Build](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/backend-build.yml/badge.svg)](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/backend-build.yml)
[![Backend Tests](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/backend-tests.yml)
[![Frontend Build](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/frontend-build.yml/badge.svg)](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/frontend-build.yml)
[![Frontend Tests](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/frontend-tests.yml)
[![E2E Tests](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/tomassvensson/angular-quarkus-demo/actions/workflows/e2e-tests.yml)

Full-stack demo application with:
- Angular frontend (`frontend/`)
- Quarkus backend (`backend/`)
- AWS Cognito login/logout and role-based access
- GraphQL API at `/api/v1/graphql`

## Architecture

```text
Browser (Angular @ :4200)
  -> Sign in/out links -> Quarkus OIDC endpoints (:8080)
  -> GraphQL queries/mutations (with session cookie) -> /api/v1/graphql
		-> Quarkus GraphQL + Cognito Admin API
			 -> AWS Cognito User Pool
```

### Key behavior
- Backend owns authentication flow and secrets.
- Frontend uses session-based calls (`withCredentials`) to GraphQL.
- Role-based menu and admin user management UI.
- Login policy blocks disallowed usernames via `app.test.disallowed-usernames`.

## Technologies Used

- **Frontend**: Angular 21, TypeScript, Tailwind CSS, Vitest, Playwright
- **Backend**: Quarkus 3, Java 21, SmallRye GraphQL, OIDC
- **AWS**: Cognito User Pool + Cognito Admin API (AWS SDK v2)
- **Build/Test**: Maven Wrapper, npm

## Product Screenshots

### Login screen

![Login screen](docs/screenshots/login-screen.png)

### Role-based menu

![Role-based menu](docs/screenshots/role-based-menu.png)

### Admin user management view

![Admin user management view](docs/screenshots/admin-user-management-view.png)

## Implementation Status

### ✅ Implemented
- login/logout redirects handled by backend and returned to Angular
- versioned GraphQL endpoint at `/api/v1/graphql`
- role-based menu visibility and admin user listing/editing UI
- disallowed username login policy via `app.test.disallowed-usernames`
- long session idle extension configuration (`12H`) and auth-loss redirect behavior
- frontend build/tests/e2e and backend tests in GitHub Actions

### ⏳ Work in progress / next improvements
- full hosted-Cognito UI auth e2e in CI (currently excluded as `external-auth`)
- deeper admin CRUD flows (create/delete users, richer validation)
- refresh token/session edge-case hardening for multi-tab race conditions
- production deployment automation (IaC + environment promotion)

## External Dependencies

Install locally:
- **Java 21**
- **Node.js 20+** and **npm**
- **AWS account** with Cognito User Pool configured
- **AWS credentials** that allow Cognito Admin API access (for admin GraphQL operations)

For GitHub Actions CI, AWS cloud access is not required for basic pipeline validation because LocalStack is used.

## Repository Structure

```text
backend/   Quarkus API + OIDC + GraphQL
frontend/  Angular UI + Playwright E2E
```

## Configuration

### Important security note
Do **not** commit real secrets. Use environment variables or profile-local files for:
- Cognito client secret
- any cloud credentials

### Required backend settings
These are the key values used by the app:

- `quarkus.oidc.auth-server-url`
- `quarkus.oidc.client-id`
- `quarkus.oidc.credentials.secret`
- `cognito.domain`
- `cognito.user-pool-id`
- `app.frontend-base-url` (default: `http://localhost:4200`)
- `app.test.disallowed-usernames` (comma-separated local parts before `@`)

### Environment variable equivalents
Quarkus properties can be overridden via environment variables. Common ones:

- `QUARKUS_OIDC_AUTH_SERVER_URL`
- `QUARKUS_OIDC_CLIENT_ID`
- `QUARKUS_OIDC_CREDENTIALS_SECRET`
- `COGNITO_DOMAIN`
- `COGNITO_USER_POOL_ID`
- `APP_FRONTEND_BASE_URL`
- `APP_TEST_DISALLOWED_USERNAMES`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (if using temporary credentials)

## AWS Cognito Setup

Create/use a Cognito User Pool and App Client with:

1. **OAuth flow**: Authorization code grant
2. **Scopes**: at least `openid`, `email`
3. **Identity provider**: Cognito user pool directory
4. **Allowed callback URLs** (local):
	- `http://localhost:8080/login`
	- `http://localhost:8080/login/oauth2/code/cognito` (optional compatibility)
	- `http://localhost:8081/login` (for tests)
	- `http://localhost:8081/login/oauth2/code/cognito` (optional compatibility)
5. **Allowed sign-out URLs**:
	- `http://localhost:4200/`
	- `http://localhost:8080/`
	- `http://localhost:8081/`
6. Create groups used by the app:
	- `RegularUser`
	- `AdminUser`
	- `OwnerUser`
	- `NoPermissionsTestUser`

## Run Locally

### 1) Start backend

From repo root:

```bash
cd backend
./mvnw quarkus:dev
```

Backend URL: `http://localhost:8080`

### 2) Start frontend

In another terminal:

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:4200`

### 3) Open in browser

Start here:
- `http://localhost:4200`

Login/logout endpoints (backend-handled):
- `http://localhost:8080/login`
- `http://localhost:8080/logout`

GraphQL endpoint:
- `http://localhost:8080/api/v1/graphql`

## LocalStack (Optional Local CI-like Testing)

Start LocalStack services used by CI:

```bash
docker compose -f .github/localstack/docker-compose.localstack.yml up -d
```

Seed Cognito + SSM test resources:

```bash
bash .github/localstack/seed-localstack.sh
```

This creates:
- Cognito user pool + app client
- groups: `RegularUser`, `AdminUser`, `OwnerUser`, `NoPermissionsTestUser`
- seeded users assigned to groups
- SSM parameters for pool/client config

## Testing

### Backend tests

```bash
cd backend
./mvnw test
```

For CI-style run (exclude hosted-Cognito UI browser test):

```bash
cd backend
./mvnw test -Djunit.jupiter.tags.exclude=external-auth
```

Includes:
- API and integration tests
- GraphQL smoke test
- login policy tests
- Playwright-based backend E2E checks

### Frontend unit tests

```bash
cd frontend
npm test -- --watch=false
```

### Frontend E2E tests (Playwright)

```bash
cd frontend
npm run e2e
```

If Playwright browsers are missing:

```bash
npx playwright install chromium
```

## GitHub Actions: test before pushing

You can run almost the same pipeline locally to avoid wasting GitHub minutes:

1. Run the same commands locally:
	- backend build: `cd backend && ./mvnw -DskipTests package`
	- backend tests: `cd backend && ./mvnw test`
	- frontend build: `cd frontend && npm ci && npm run build`
	- frontend tests: `cd frontend && npm test -- --watch=false`
	- frontend e2e: `cd frontend && npm run e2e`

2. Run LocalStack-backed backend test prep locally:
	- `docker compose -f .github/localstack/docker-compose.localstack.yml up -d`
	- `bash .github/localstack/seed-localstack.sh`

3. Optional: run GitHub workflows locally with `act`:
	- install `act` (https://github.com/nektos/act)
	- run specific workflow, for example:
	  - `act push -W .github/workflows/backend-tests.yml`
	  - `act push -W .github/workflows/frontend-tests.yml`

Note: `act` and GitHub-hosted runners are similar but not identical; always treat local runs as pre-checks and GitHub as final truth.

## Troubleshooting

- **Login redirect mismatch**: confirm callback/sign-out URLs in Cognito exactly match local ports.
- **Admin user list fails**: verify AWS credentials and Cognito permissions.
- **Frontend cannot call API**: ensure backend is running on `:8080` and CORS allows `http://localhost:4200`.
- **Session issues**: app is configured for long idle extension (`12H`); verify OIDC and browser cookie settings.

## GitHub CI

Workflow files:
- `.github/workflows/backend-build.yml`
- `.github/workflows/backend-tests.yml`
- `.github/workflows/frontend-build.yml`
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/e2e-tests.yml`

They run on every push and pull request and provide separate pass/fail badges.

## Security Posture Notes

- **CSRF strategy**: keep state-changing operations behind authenticated GraphQL calls with cookie session; for production, add explicit CSRF token validation (double-submit or synchronizer token) on mutation routes.
- **Cookie flags (production expectation)**: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` if UX permits), and TLS-only ingress.
- **Secrets management**:
	- local/dev: environment variables and LocalStack SSM for test-only values
	- production: managed secret store (AWS SSM Parameter Store / Secrets Manager), never checked into repo

## Notes for Production

- Move secrets out of `application.properties`.
- Use environment-specific config/profiles.
- Restrict `app.test.disallowed-usernames` as part of deployment policy.
