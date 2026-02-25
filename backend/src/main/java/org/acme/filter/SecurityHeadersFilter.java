package org.acme.filter;

import io.vertx.ext.web.Router;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

/**
 * Global HTTP security headers filter.
 * <p>
 * Adds security headers to ALL responses (REST, GraphQL, Swagger UI, health endpoints, etc.)
 * by registering a Vert.x route handler on the main router.
 * <p>
 * Fixes OWASP ZAP DAST findings:
 * <ul>
 *   <li>[10020] Missing Anti-clickjacking Header → X-Frame-Options</li>
 *   <li>[10021] X-Content-Type-Options Header Missing</li>
 *   <li>[10038] Content Security Policy (CSP) Header Not Set</li>
 *   <li>[10055] CSP: Failure to Define Directive with No Fallback</li>
 *   <li>[10063] Permissions Policy Header Not Set</li>
 *   <li>[90004] Cross-Origin headers (CORP, COEP, COOP)</li>
 * </ul>
 */
@ApplicationScoped
public class SecurityHeadersFilter {

    // CSP with all directives explicitly defined to avoid ZAP [10055] "no fallback" warnings.
    // No unsafe-inline/unsafe-eval — Swagger UI and GraphQL UI are disabled in production.
    static final String CONTENT_SECURITY_POLICY =
            "default-src 'self'; "
                    + "script-src 'self'; "
                    + "style-src 'self'; "
                    + "img-src 'self' data: https://www.gravatar.com; "
                    + "font-src 'self'; "
                    + "connect-src 'self' wss:; "
                    + "frame-ancestors 'none'; "
                    + "form-action 'self'; "
                    + "base-uri 'self'; "
                    + "object-src 'none'";

    /**
     * Registers a global Vert.x route handler that adds security headers to every response.
     * The handler runs before application handlers (order -1) so headers are set
     * regardless of which handler ultimately produces the response.
     */
    public void registerSecurityHeaders(@Observes Router router) {
        router.route().order(-1).handler(ctx -> {
            ctx.response()
                    .putHeader("X-Frame-Options", "DENY")
                    .putHeader("X-Content-Type-Options", "nosniff")
                    .putHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY)
                    .putHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
                    .putHeader("Cross-Origin-Resource-Policy", "same-origin")
                    .putHeader("Cross-Origin-Embedder-Policy", "unsafe-none")
                    .putHeader("Cross-Origin-Opener-Policy", "same-origin");
            ctx.next();
        });
    }
}
