package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.acme.security.LoginPolicyService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class LoginPolicyServiceTest {

    @Inject
    LoginPolicyService loginPolicyService; // NOSONAR java:S6813 - @Inject field injection is standard in @QuarkusTest

    @Test
    void disallowedUsernamesAreBlockedRegardlessOfDomain() {
        assertTrue(loginPolicyService.isDisallowedPrincipal("aqdisallowed1@tomas-svensson.de"));
        assertTrue(loginPolicyService.isDisallowedPrincipal("aqdisallowed1@gmail.com"));
        assertTrue(loginPolicyService.isDisallowedPrincipal("aqdisallowed2@example.com"));
    }

    @Test
    void usernamesNotInListAreAllowed() {
        assertFalse(loginPolicyService.isDisallowedPrincipal("allowed.user@tomas-svensson.de"));
        assertFalse(loginPolicyService.isDisallowedPrincipal("someowner"));
    }
}
