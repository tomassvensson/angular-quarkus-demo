package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

@QuarkusTest
class GraphqlSmokeTest {

    @Test
    void versionedGraphqlEndpointExistsAndIsProtected() {
        given()
                .redirects().follow(false)
                .contentType("application/json")
                .body("{\"query\":\"query { me { username } }\"}")
                .when().post("/api/v1/graphql")
                .then()
                // GraphQL endpoint is public (200), but 'me' query is protected
                // and should return an error or null data when unauthenticated.
                // SmallRye GraphQL returns 200 with errors in the body for auth failures by default.
                .statusCode(200)
                .body("errors", org.hamcrest.Matchers.notNullValue())
                .body("data.me", org.hamcrest.Matchers.nullValue());
    }

    @Test
    void legacyGraphqlPathIsNotExposed() {
        given()
                .redirects().follow(false)
                .contentType("application/json")
                .body("{\"query\":\"query { __typename }\"}")
                .when().post("/graphql")
                .then()
                .statusCode(404);
    }
}
