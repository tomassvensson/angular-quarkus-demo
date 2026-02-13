package org.acme;

import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Protected endpoint that triggers the OIDC authentication flow.
 * After successful authentication, redirects the user to the home page.
 */
@Path("/login")
@Authenticated
public class LoginResource {

    @ConfigProperty(name = "app.frontend-base-url")
    String frontendBaseUrl;

    @GET
    public Response login() {
        return Response.seeOther(URI.create(normalizedBaseUrl())).build();
    }

    private String normalizedBaseUrl() {
        return frontendBaseUrl.endsWith("/") ? frontendBaseUrl : frontendBaseUrl + "/";
    }
}
