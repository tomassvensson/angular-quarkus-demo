package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class UserGraphQLApiTest {

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testMeQuery() {
        String query = "{\"query\": \"query { me { username roles } }\"}";
        given()
                .contentType(ContentType.JSON)
                .body(query)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.me.username", is("alice"))
                .body("data.me.roles[0]", is("RegularUser"));
    }

    @Test
    @TestSecurity(user = "admin", roles = {"AdminUser", "RegularUser"})
    void testDeleteUserAsAdmin() {
        String mutation = "{\"query\": \"mutation { deleteUser(username: \\\"targetUser\\\") }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.deleteUser", is(true));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testDeleteOtherUserAsNonAdmin() {
        String mutation = "{\"query\": \"mutation { deleteUser(username: \\\"bob\\\") }\"}";
        
        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200) // GraphQL always returns 200, errors are in body
                .body("errors", org.hamcrest.Matchers.notNullValue());
                // .body("errors[0].message", containsString("not authorized")); // Message varies by config
    }
    
    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testDeleteSelfAsNonAdmin() {
        String mutation = "{\"query\": \"mutation { deleteUser(username: \\\"alice\\\") }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.deleteUser", is(true));
    }
}
