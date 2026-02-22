package org.acme;

import io.quarkus.oidc.OidcSession;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.core.Response;
import org.acme.security.LoginPolicyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.security.Principal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for LoginResource.
 */
class LoginResourceTest {

    private LoginResource resource;
    private SecurityIdentity mockIdentity;
    private OidcSession mockSession;
    private LoginPolicyService mockPolicyService;

    @BeforeEach
    void setUp() throws Exception {
        mockIdentity = mock(SecurityIdentity.class);
        mockSession = mock(OidcSession.class);
        mockPolicyService = mock(LoginPolicyService.class);

        resource = new LoginResource(mockIdentity, mockSession, mockPolicyService);
        setField("frontendBaseUrl", "http://localhost:4200");
    }

    private void setField(String name, Object value) throws Exception {
        Field field = LoginResource.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(resource, value);
    }

    @Test
    void testLoginAllowed() {
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("alice");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.<String>getAttribute("email")).thenReturn("alice@test.com");
        when(mockPolicyService.isDisallowedPrincipal("alice@test.com")).thenReturn(false);

        Response response = resource.login().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        assertEquals("http://localhost:4200/", response.getLocation().toString());
    }

    @Test
    void testLoginDisallowed() {
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("blocked");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.<String>getAttribute("email")).thenReturn("blocked@test.com");
        when(mockPolicyService.isDisallowedPrincipal("blocked@test.com")).thenReturn(true);
        when(mockSession.logout()).thenReturn(Uni.createFrom().voidItem());

        Response response = resource.login().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        assertTrue(response.getLocation().toString().contains("auth=denied"));
        verify(mockSession).logout();
    }

    @Test
    void testLoginDisallowedLogoutFailure() {
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("blocked");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.<String>getAttribute("email")).thenReturn("blocked@test.com");
        when(mockPolicyService.isDisallowedPrincipal("blocked@test.com")).thenReturn(true);
        when(mockSession.logout()).thenReturn(Uni.createFrom().failure(new RuntimeException("Session error")));

        Response response = resource.login().await().indefinitely();

        // Should recover and still redirect to denied
        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        assertTrue(response.getLocation().toString().contains("auth=denied"));
    }

    @Test
    void testLoginNullEmail() {
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("alice");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.<String>getAttribute("email")).thenReturn(null);
        when(mockPolicyService.isDisallowedPrincipal("alice")).thenReturn(false);

        Response response = resource.login().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        assertEquals("http://localhost:4200/", response.getLocation().toString());
    }

    @Test
    void testLoginNullPrincipal() {
        when(mockIdentity.getPrincipal()).thenReturn(null);
        when(mockIdentity.<String>getAttribute("email")).thenReturn(null);
        when(mockPolicyService.isDisallowedPrincipal("")).thenReturn(false);

        Response response = resource.login().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
    }

    @Test
    void testLoginBaseUrlWithTrailingSlash() throws Exception {
        setField("frontendBaseUrl", "http://localhost:4200/");

        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("alice");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.<String>getAttribute("email")).thenReturn("alice@test.com");
        when(mockPolicyService.isDisallowedPrincipal("alice@test.com")).thenReturn(false);

        Response response = resource.login().await().indefinitely();

        // Should not double the slash
        assertEquals("http://localhost:4200/", response.getLocation().toString());
    }
}
