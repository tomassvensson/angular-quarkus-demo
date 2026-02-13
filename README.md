# Angular + Quarkus + AWS Cognito Demo

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

## External Dependencies

Install locally:
- **Java 21**
- **Node.js 20+** and **npm**
- **AWS account** with Cognito User Pool configured
- **AWS credentials** that allow Cognito Admin API access (for admin GraphQL operations)

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

## Testing

### Backend tests

```bash
cd backend
./mvnw test
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

## Troubleshooting

- **Login redirect mismatch**: confirm callback/sign-out URLs in Cognito exactly match local ports.
- **Admin user list fails**: verify AWS credentials and Cognito permissions.
- **Frontend cannot call API**: ensure backend is running on `:8080` and CORS allows `http://localhost:4200`.
- **Session issues**: app is configured for long idle extension (`12H`); verify OIDC and browser cookie settings.

## Notes for Production

- Move secrets out of `application.properties`.
- Use environment-specific config/profiles.
- Restrict `app.test.disallowed-usernames` as part of deployment policy.
