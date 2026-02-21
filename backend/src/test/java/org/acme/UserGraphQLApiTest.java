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

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testChangePasswordSuccess() {
        String mutation = "{\"query\": \"mutation ChangePassword($input: ChangePasswordInput!) { changePassword(input: $input) }\", " +
                "\"variables\": {\"input\": {\"currentPassword\": \"OldPass1!\", \"newPassword\": \"NewPass1!\"}}}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.changePassword", is(true));
    }

    @Test
    void testChangePasswordUnauthenticated() {
        String mutation = "{\"query\": \"mutation ChangePassword($input: ChangePasswordInput!) { changePassword(input: $input) }\", " +
                "\"variables\": {\"input\": {\"currentPassword\": \"OldPass1!\", \"newPassword\": \"NewPass1!\"}}}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("errors", org.hamcrest.Matchers.notNullValue());
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testTrustedDevicesQuery() {
        // In keycloak mock mode, returns empty list
        String query = "{\"query\": \"query { trustedDevices { deviceKey deviceName } }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(query)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.trustedDevices", org.hamcrest.Matchers.hasSize(0));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testForgetDeviceMutation() {
        String mutation = "{\"query\": \"mutation { forgetDevice(deviceKey: \\\"device-123\\\") }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.forgetDevice", is(true));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testSetMfaPreferenceMutation() {
        String mutation = "{\"query\": \"mutation SetMfa($input: MfaPreferenceInput!) { setMfaPreference(input: $input) }\", " +
                "\"variables\": {\"input\": {\"totpEnabled\": true, \"smsEnabled\": false, \"preferredMethod\": \"TOTP\"}}}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.setMfaPreference", is(true));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testSetupTotpMutation() {
        String mutation = "{\"query\": \"mutation { setupTotp { secretCode qrCodeUri } }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.setupTotp.secretCode", is("MOCK_SECRET_FOR_DEV"))
                .body("data.setupTotp.qrCodeUri", org.hamcrest.Matchers.containsString("otpauth://totp/"));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"RegularUser"})
    void testVerifyTotpMutation() {
        String mutation = "{\"query\": \"mutation { verifyTotp(code: \\\"123456\\\") }\"}";

        given()
                .contentType(ContentType.JSON)
                .body(mutation)
                .when().post("/api/v1/graphql")
                .then()
                .statusCode(200)
                .body("data.verifyTotp", is(true));
    }
}
