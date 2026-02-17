package org.acme;

import io.quarkus.oidc.OidcSession;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.util.Optional;
import org.acme.security.LoginPolicyService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Protected endpoint that triggers the OIDC authentication flow.
 * After successful authentication, redirects the user to the home page.
 */
@Path("/login")
@Authenticated
public class LoginResource {

    private final SecurityIdentity identity;
    private final OidcSession oidcSession;
    private final LoginPolicyService loginPolicyService;

    @ConfigProperty(name = "app.frontend-base-url")
    String frontendBaseUrl;

    @Inject
    public LoginResource(SecurityIdentity identity, OidcSession oidcSession, LoginPolicyService loginPolicyService) {
        this.identity = identity;
        this.oidcSession = oidcSession;
        this.loginPolicyService = loginPolicyService;
    }

    @GET
    public Uni<Response> login() {
        String principal = Optional.ofNullable(identity.getPrincipal())
                .map(java.security.Principal::getName)
                .orElse("");
        String email = Optional.ofNullable(identity.<String>getAttribute("email")).orElse(principal);

        if (loginPolicyService.isDisallowedPrincipal(email)) {
            URI deniedUri = URI.create(normalizedBaseUrl() + "?auth=denied");
            return oidcSession.logout()
                    .onItem().transform(v -> Response.seeOther(deniedUri).build())
                    .onFailure().recoverWithItem(Response.seeOther(deniedUri).build());
        }

        return Uni.createFrom().item(Response.seeOther(URI.create(normalizedBaseUrl())).build());
    }

    private String normalizedBaseUrl() {
        return frontendBaseUrl.endsWith("/") ? frontendBaseUrl : frontendBaseUrl + "/";
    }
}
