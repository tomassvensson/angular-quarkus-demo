package org.acme;

import io.quarkus.oidc.OidcSession;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Custom logout endpoint for AWS Cognito.
 * <p>
 * Cognito does NOT support standard OIDC RP-Initiated Logout (id_token_hint,
 * post_logout_redirect_uri). Instead it requires: client_id + logout_uri.
 * This endpoint uses OidcSession.logout() to properly invalidate the local
 * OIDC session, then redirects to Cognito's logout URL.
 * </p>
 */
@Path("/logout")
public class LogoutResource {

    @Inject
    SecurityIdentity identity;

    @Inject
    OidcSession oidcSession;

    @ConfigProperty(name = "quarkus.oidc.client-id")
    String clientId;

    @ConfigProperty(name = "cognito.domain")
    String cognitoDomain;

    @GET
    public Uni<Response> logout(@Context UriInfo uriInfo) {
        // Build base URL dynamically from request (handles port 8080 dev / 8081 test)
        URI baseUri = uriInfo.getBaseUri();
        String baseUrl = baseUri.getScheme() + "://" + baseUri.getAuthority();
        String logoutUri = URLEncoder.encode(baseUrl + "/", StandardCharsets.UTF_8);

        // Cognito logout format: https://<domain>/logout?client_id=<id>&logout_uri=<uri>
        String cognitoLogoutUrl = "https://" + cognitoDomain + "/logout"
                + "?client_id=" + clientId
                + "&logout_uri=" + logoutUri;

        // Use OidcSession.logout() to properly clear all OIDC session cookies,
        // then redirect to Cognito's logout endpoint to end the SSO session.
        if (!identity.isAnonymous()) {
            return oidcSession.logout()
                    .onItem().transform(v -> Response.seeOther(URI.create(cognitoLogoutUrl)).build())
                    .onFailure().recoverWithItem(Response.seeOther(URI.create(cognitoLogoutUrl)).build());
        }
        // Already logged out — redirect to Cognito anyway to clear SSO session
        return Uni.createFrom().item(Response.seeOther(URI.create(cognitoLogoutUrl)).build());
    }
}
