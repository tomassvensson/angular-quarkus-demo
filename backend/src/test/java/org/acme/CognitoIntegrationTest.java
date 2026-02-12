package org.acme;

import io.quarkus.test.junit.QuarkusIntegrationTest;
import io.quarkus.test.common.QuarkusTestResource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Order;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

@QuarkusIntegrationTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CognitoIntegrationTest {

    // Note: Full end-to-end testing with real Cognito requires opening a browser
    // or simulating the full OAuth2 flow (auth code exchange), which is complex in REST Assured.
    // However, we can test that endpoints are protected or public as expected.
    
    @Test
    @Order(1)
    public void testHomePageIsPublic() {
        given()
                .when().get("/")
                .then()
                .statusCode(200)
                .body(containsString("AWS Cognito Demo App"));
    }

    @Test
    @Order(2)
    public void testProtectedEndpointRedirectsToLogin() {
        // Accessing /user without auth should redirect (302) to Cognito
        given()
                .redirects().follow(false) // Disable auto-redirect to check the 302
                .when().get("/user")
                .then()
                .statusCode(302)
                .header("Location", containsString("amazoncognito.com"));
    }
}
