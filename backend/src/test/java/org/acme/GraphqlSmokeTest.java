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
                .statusCode(anyOf(is(302), is(401)));
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
