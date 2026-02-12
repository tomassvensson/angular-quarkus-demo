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

    @Inject
    Template home;

    @Inject
    SecurityIdentity identity;

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance get() {
        return home.data("identity", identity);
    }
}
