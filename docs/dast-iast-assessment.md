# DAST & IAST Assessment

## Current DAST Setup

The project uses **OWASP ZAP** for Dynamic Application Security Testing (DAST) during E2E tests:

- **Baseline Scan**: Spider + passive scan against `http://localhost:8080` (backend)
- **API Scan** (new): OpenAPI-driven active scan targeting `/q/openapi` spec
- Reports uploaded as CI artifacts: `zap-dast-report`, `zap-api-scan-report`
- Rules configuration: `.github/zap/rules.tsv`

## ZAP DAST Findings & Fixes

| # | Finding | ZAP ID | Severity | Status | Fix |
|---|---------|--------|----------|--------|-----|
| 1 | Missing Anti-clickjacking Header | 10020 | Medium | ✅ Fixed | `SecurityHeadersFilter` adds `X-Frame-Options: DENY` |
| 2 | X-Content-Type-Options Header Missing | 10021 | Low | ✅ Fixed | `SecurityHeadersFilter` adds `X-Content-Type-Options: nosniff` |
| 3 | Content Security Policy Not Set | 10038 | Medium | ✅ Fixed | `SecurityHeadersFilter` adds CSP header |
| 4 | Permissions Policy Header Not Set | 10063 | Low | ✅ Fixed | `SecurityHeadersFilter` adds `Permissions-Policy` |
| 5 | Cross-Origin-Resource-Policy Missing | 90004 | Low | ✅ Fixed | `SecurityHeadersFilter` adds `Cross-Origin-Resource-Policy: same-origin` |
| 6 | Cookie without SameSite Attribute | 10054 | Low | ✅ Fixed | `quarkus.oidc.authentication.cookie-same-site=lax` in application.properties |
| 7 | Cross-Domain JS Source File Inclusion | 10017 | Low | ⚠️ Acknowledged | False positive — scripts served from same origin in CI. Kept as WARN. |
| 8 | Sub Resource Integrity Missing | 90003 | Low | ⚠️ Acknowledged | SRI not applicable to first-party scripts. Kept as WARN. |

### SecurityHeadersFilter

A global Vert.x route handler (`org.acme.filter.SecurityHeadersFilter`) adds security headers to ALL HTTP responses, covering REST, GraphQL, Swagger UI, GraphQL UI, and health endpoints.

### Content Security Policy (CSP)

The CSP allows:
- `default-src 'self'` — same-origin only
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — needed for Swagger UI and GraphQL UI
- `style-src 'self' 'unsafe-inline'` — needed for Swagger UI inline styles
- `img-src 'self' data:` — needed for Swagger UI base64 images
- `font-src 'self'` — fonts from same origin
- `connect-src 'self'` — API calls from same origin

**Production recommendation**: Consider tightening CSP by removing `'unsafe-inline'` and `'unsafe-eval'` if Swagger/GraphQL UI are disabled in production.

## IAST Assessment

### What is IAST?

Interactive Application Security Testing (IAST) instruments the application at runtime to detect vulnerabilities by observing data flow during normal execution (e.g., E2E tests).

### Current IAST-like Capabilities

| Capability | Tool | Status |
|-----------|------|--------|
| Code coverage during E2E | JaCoCo agent | ✅ Active — `jacocoagent.jar` instruments JVM during E2E |
| Static analysis | CodeQL, SonarCloud | ✅ Active — scans code for security patterns |
| Dependency scanning | Trivy, Dependabot | ✅ Active — CVE detection |
| Dynamic scanning | OWASP ZAP | ✅ Active — baseline + API scan |

### True IAST Tools (Not Implemented)

True IAST tools like **Contrast Security**, **Hdiv Security**, or **Synopsys Seeker** provide real-time vulnerability detection by instrumenting bytecode. These require:

- **Commercial licenses** (not feasible for a demo project)
- **Java agent integration** (similar to how JaCoCo is already integrated)
- **Cloud dashboards** for results aggregation

### Recommended Alternative: OWASP ZAP API Scan

Instead of commercial IAST, the project now includes a **ZAP API Scan** that:
1. Reads the OpenAPI spec from `/q/openapi`
2. Generates targeted requests for all documented API endpoints
3. Performs active scanning (injection tests, auth bypass attempts)
4. Reports API-specific vulnerabilities not found by baseline spider

This provides better API coverage than the baseline scan alone, approximating some IAST benefits (endpoint-aware, input-aware scanning) without commercial tooling.

## Recommendations for Production

1. **Tighten CSP**: Remove `'unsafe-inline'` and `'unsafe-eval'` if Swagger/GraphQL UI disabled
2. **Add HSTS**: Enable `Strict-Transport-Security` when running behind TLS
3. **Authenticated ZAP Scan**: Configure ZAP with auth tokens to scan protected endpoints
4. **Consider IAST**: If budget allows, Contrast Community Edition (free for 1 app) provides true IAST
5. **Schedule Full Scans**: Run ZAP full-scan (not just baseline) on a weekly schedule
6. **Monitor ZAP Trends**: Track WARN count over time to detect regressions
