package org.acme.filter;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

/**
 * Tests that security headers are present on HTTP responses.
 * Validates the SecurityHeadersFilter applied via the Vert.x Router.
 */
@QuarkusTest
class SecurityHeadersFilterTest {

    @Test
    @TestSecurity(user = "testuser", roles = {"RegularUser"})
    void testSecurityHeadersOnRestEndpoint() {
        given()
            .when().get("/")
            .then()
                .header("X-Frame-Options", equalTo("DENY"))
                .header("X-Content-Type-Options", equalTo("nosniff"))
                .header("Content-Security-Policy",
                        equalTo(SecurityHeadersFilter.CONTENT_SECURITY_POLICY))
                .header("Permissions-Policy",
                        equalTo("camera=(), microphone=(), geolocation=()"))
                .header("Cross-Origin-Resource-Policy", equalTo("same-origin"))
                .header("Cross-Origin-Embedder-Policy", equalTo("unsafe-none"))
                .header("Cross-Origin-Opener-Policy", equalTo("same-origin"));
    }

    @Test
    void testSecurityHeadersOnHealthEndpoint() {
        given()
            .when().get("/q/health/ready")
            .then()
                .statusCode(200)
                .header("X-Frame-Options", equalTo("DENY"))
                .header("X-Content-Type-Options", equalTo("nosniff"))
                .header("Content-Security-Policy",
                        equalTo(SecurityHeadersFilter.CONTENT_SECURITY_POLICY))
                .header("Permissions-Policy",
                        equalTo("camera=(), microphone=(), geolocation=()"))
                .header("Cross-Origin-Resource-Policy", equalTo("same-origin"))
                .header("Cross-Origin-Embedder-Policy", equalTo("unsafe-none"))
                .header("Cross-Origin-Opener-Policy", equalTo("same-origin"));
    }

    @Test
    void testSecurityHeadersOnGraphQLEndpoint() {
        String query = "{\"query\": \"{ __typename }\"}";
        given()
            .contentType("application/json")
            .body(query)
            .when().post("/api/v1/graphql")
            .then()
                .header("X-Frame-Options", equalTo("DENY"))
                .header("X-Content-Type-Options", equalTo("nosniff"))
                .header("Content-Security-Policy",
                        equalTo(SecurityHeadersFilter.CONTENT_SECURITY_POLICY))
                .header("Permissions-Policy",
                        equalTo("camera=(), microphone=(), geolocation=()"))
                .header("Cross-Origin-Resource-Policy", equalTo("same-origin"))
                .header("Cross-Origin-Embedder-Policy", equalTo("unsafe-none"))
                .header("Cross-Origin-Opener-Policy", equalTo("same-origin"));
    }
}
