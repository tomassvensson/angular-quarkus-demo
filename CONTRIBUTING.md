# Contributing

Thanks for considering a contribution! This repository is a **public demo project** that showcases an **Angular + Quarkus** stack (frontend + backend + tests + CI). Contributions are welcome, with “best effort” maintenance (no guaranteed SLAs).

## Ground rules

- Be respectful and constructive in issues, PRs, and reviews.
- Keep changes focused — small PRs are easier to review and merge.
- **Do not commit secrets** (credentials, tokens, private keys, client secrets). Use local environment variables and/or secret managers.
- If you’re unsure about scope, open an issue first.

## Ways to contribute

- Bug fixes and small improvements
- Documentation fixes (README, diagrams, troubleshooting)
- Test improvements (unit/integration/E2E stability)
- CI improvements (linting, scanning, caching, workflow reliability)

## Project structure (typical)

- `backend/` — Quarkus backend (auth/OIDC, APIs, persistence)
- `frontend/` — Angular frontend (and E2E tests if present)
- `.github/` — GitHub Actions workflows and CI tooling/scripts
- `docker-compose*.yml` (if present) — local dependencies for dev/testing

## Development setup

### Prerequisites

- **Java** (matching the project’s config; currently Java 21 for modern Quarkus)
- **Node.js** (matching the project’s config; currently Node 20+ for Angular tooling)
- **Docker** (for local dependencies like Keycloak/LocalStack if used)

### Quick start (local)

> Commands may differ depending on your local setup and the current repository configuration. Prefer the repo README if it defines canonical commands.

#### Backend (Quarkus)

```bash
cd backend
./mvnw quarkus:dev
```

#### Frontend (Angular)

```bash
cd frontend
npm ci
npm start
```

## Tests

Please run the relevant tests before opening a PR.

### Backend tests

```bash
cd backend
./mvnw test
```

### Frontend unit tests

```bash
cd frontend
npm test -- --watch=false
```

### E2E tests (if configured)

```bash
cd frontend
npm run e2e
```

Playwright is used. If browsers are missing:

```bash
npx playwright install chromium
```

## Code style

- Match the existing style in the files you touch.
- Avoid drive-by formatting changes across unrelated files.
- Add/adjust tests when changing logic (especially auth and security-sensitive behavior).
- Prefer clear names, small functions, and straightforward control flow.

### Frontend

- Keep Angular patterns consistent with existing components/services.
- Avoid introducing new state management libraries unless necessary.

### Backend

- Keep Quarkus configuration consistent (profiles, config keys, env overrides).
- Prefer constructor injection / standard Quarkus patterns as used in the repo.

## Dependency and security notes

- Keep dependencies updated when making changes that touch build tooling.
- If you discover a security issue, **do not open a public issue**. See `SECURITY.md` for responsible disclosure steps.

## Pull request process

1. **Fork** the repository and create a feature branch:
   - `feat/<short-topic>` or `fix/<short-topic>`
2. Make a focused change. Update docs if behavior changes.
3. Run tests locally (see above).
4. Open a PR describing:
   - What changed and why
   - How you tested it
   - Any follow-up work or known limitations

### Review and merge

- PRs may be merged once CI passes and changes look consistent with the repo goals.
- If a PR is out of scope for a demo repo (large redesign, broad refactor), it may be declined or requested to be split.

## License

By contributing, you agree that your contributions will be licensed under the same license as this repository.
