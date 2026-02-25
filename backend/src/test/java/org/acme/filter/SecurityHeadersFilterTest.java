package org.acme.filter;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import io.restassured.response.ValidatableResponse;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

/**
 * Tests that security headers are present on HTTP responses.
 * Validates the SecurityHeadersFilter applied via the Vert.x Router.
 */
@QuarkusTest
class SecurityHeadersFilterTest {

    private static final String X_FRAME_OPTIONS = "X-Frame-Options";
    private static final String X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    private static final String PERMISSIONS_POLICY = "Permissions-Policy";
    private static final String PERMISSIONS_POLICY_VALUE = "camera=(), microphone=(), geolocation=()";
    private static final String CROSS_ORIGIN_RESOURCE_POLICY = "Cross-Origin-Resource-Policy";
    private static final String SAME_ORIGIN = "same-origin";
    private static final String CROSS_ORIGIN_EMBEDDER_POLICY = "Cross-Origin-Embedder-Policy";
    private static final String UNSAFE_NONE = "unsafe-none";
    private static final String CROSS_ORIGIN_OPENER_POLICY = "Cross-Origin-Opener-Policy";

    private static void assertSecurityHeaders(ValidatableResponse response) {
        response
            .header(X_FRAME_OPTIONS, equalTo("DENY"))
            .header(X_CONTENT_TYPE_OPTIONS, equalTo("nosniff"))
            .header("Content-Security-Policy",
                    equalTo(SecurityHeadersFilter.CONTENT_SECURITY_POLICY))
            .header(PERMISSIONS_POLICY, equalTo(PERMISSIONS_POLICY_VALUE))
            .header(CROSS_ORIGIN_RESOURCE_POLICY, equalTo(SAME_ORIGIN))
            .header(CROSS_ORIGIN_EMBEDDER_POLICY, equalTo(UNSAFE_NONE))
            .header(CROSS_ORIGIN_OPENER_POLICY, equalTo(SAME_ORIGIN));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"RegularUser"})
    void testSecurityHeadersOnRestEndpoint() {
        assertSecurityHeaders(
            given()
                .when().get("/")
                .then()
        );
    }

    @Test
    void testSecurityHeadersOnHealthEndpoint() {
        assertSecurityHeaders(
            given()
                .when().get("/q/health/ready")
                .then()
                    .statusCode(200)
        );
    }

    @Test
    void testSecurityHeadersOnGraphQLEndpoint() {
        String query = "{\"query\": \"{ __typename }\"}";
        assertSecurityHeaders(
            given()
                .contentType("application/json")
                .body(query)
                .when().post("/api/v1/graphql")
                .then()
        );
    }
}
