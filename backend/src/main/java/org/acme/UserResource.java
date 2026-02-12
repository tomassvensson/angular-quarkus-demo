package org.acme;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/user")
@Authenticated
public class UserResource {

    @Inject
    SecurityIdentity identity;

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String me() {
        return "Hello " + identity.getPrincipal().getName() + "! You are logged in.";
    }
}
