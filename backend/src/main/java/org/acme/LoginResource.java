package org.acme;

import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;

/**
 * Protected endpoint that triggers the OIDC authentication flow.
 * After successful authentication, redirects the user to the home page.
 */
@Path("/login")
@Authenticated
public class LoginResource {

    @GET
    public Response login() {
        return Response.seeOther(URI.create("/")).build();
    }
}
