package org.acme;

import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/")
public class HomeResource {

    private final Template home;
    private final SecurityIdentity identity;

    @Inject
    public HomeResource(Template home, SecurityIdentity identity) {
        this.home = home;
        this.identity = identity;
    }

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance get() {
        String name = identity.getPrincipal().getName();
        if (name == null || name.isEmpty()) {
            name = "User"; // Fallback
        }
        return home.data("identity", identity)
                   .data("displayName", name)
                   .data("groups", identity.getRoles());
    }
}
