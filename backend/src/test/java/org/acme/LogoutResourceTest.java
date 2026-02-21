package org.acme;

import io.quarkus.oidc.OidcSession;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for LogoutResource.
 */
class LogoutResourceTest {

    private LogoutResource resource;
    private SecurityIdentity mockIdentity;
    private OidcSession mockSession;

    @BeforeEach
    void setUp() throws Exception {
        mockIdentity = mock(SecurityIdentity.class);
        mockSession = mock(OidcSession.class);

        resource = new LogoutResource(mockIdentity, mockSession);
        setField("clientId", "test-client-id");
        setField("cognitoDomain", "my-domain.auth.eu-central-1.amazoncognito.com");
        setField("authProvider", "cognito");
        setField("authServerUrl", "https://cognito-idp.eu-central-1.amazonaws.com/poolId");
        setField("frontendBaseUrl", "http://localhost:4200");
    }

    private void setField(String name, Object value) throws Exception {
        Field field = LogoutResource.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(resource, value);
    }

    @Test
    void testLogoutCognitoAuthenticatedUser() {
        when(mockIdentity.isAnonymous()).thenReturn(false);
        when(mockSession.logout()).thenReturn(Uni.createFrom().voidItem());

        Response response = resource.logout().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        String location = response.getLocation().toString();
        assertTrue(location.contains("my-domain.auth.eu-central-1.amazoncognito.com/logout"));
        assertTrue(location.contains("client_id=test-client-id"));
        verify(mockSession).logout();
    }

    @Test
    void testLogoutCognitoAnonymousUser() {
        when(mockIdentity.isAnonymous()).thenReturn(true);

        Response response = resource.logout().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        verify(mockSession, never()).logout();
    }

    @Test
    void testLogoutCognitoLogoutFailure() {
        when(mockIdentity.isAnonymous()).thenReturn(false);
        when(mockSession.logout()).thenReturn(Uni.createFrom().failure(new RuntimeException("Session error")));

        Response response = resource.logout().await().indefinitely();

        // Should recover and still redirect
        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
    }

    @Test
    void testLogoutCognitoDomainBlank() throws Exception {
        setField("cognitoDomain", "");
        when(mockIdentity.isAnonymous()).thenReturn(false);
        when(mockSession.logout()).thenReturn(Uni.createFrom().voidItem());

        Response response = resource.logout().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        // Should fallback to frontendBaseUrl
        assertEquals("http://localhost:4200", response.getLocation().toString());
    }

    @Test
    void testLogoutKeycloakProvider() throws Exception {
        setField("authProvider", "keycloak");
        setField("authServerUrl", "http://localhost:8080/realms/test");
        when(mockIdentity.isAnonymous()).thenReturn(false);
        when(mockSession.logout()).thenReturn(Uni.createFrom().voidItem());

        Response response = resource.logout().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        String location = response.getLocation().toString();
        assertTrue(location.contains("openid-connect/logout"));
        assertTrue(location.contains("client_id=test-client-id"));
    }

    @Test
    void testLogoutKeycloakButCognitoUrl() throws Exception {
        // authProvider is keycloak, but auth server URL contains "cognito" -> use Cognito flow
        setField("authProvider", "keycloak");
        setField("authServerUrl", "https://cognito-idp.eu-central-1.amazonaws.com/poolId");
        when(mockIdentity.isAnonymous()).thenReturn(false);
        when(mockSession.logout()).thenReturn(Uni.createFrom().voidItem());

        Response response = resource.logout().await().indefinitely();

        assertEquals(Response.Status.SEE_OTHER.getStatusCode(), response.getStatus());
        String location = response.getLocation().toString();
        assertTrue(location.contains("amazoncognito.com/logout"));
    }
}
