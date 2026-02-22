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
 *   <li>[10063] Permissions Policy Header Not Set</li>
 *   <li>[90004] Cross-Origin-Resource-Policy Header Missing or Invalid</li>
 * </ul>
 */
@ApplicationScoped
public class SecurityHeadersFilter {

    // CSP allows inline scripts/styles and eval for Swagger UI and GraphQL UI
    static final String CONTENT_SECURITY_POLICY =
            "default-src 'self'; "
                    + "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    + "style-src 'self' 'unsafe-inline'; "
                    + "img-src 'self' data:; "
                    + "font-src 'self'; "
                    + "connect-src 'self'";

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
                    .putHeader("Cross-Origin-Resource-Policy", "same-origin");
            ctx.next();
        });
    }
}
