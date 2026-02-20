package org.acme.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.nio.file.Files;

/**
 * Serves the repository README.md content for rendering on the frontend homepage.
 */
@Path("/api/v1/readme")
public class ReadmeResource {

    private static final Logger LOG = Logger.getLogger(ReadmeResource.class);

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public Response getReadme() {
        // Try repo root (relative to backend working directory)
        java.nio.file.Path[] candidates = {
            java.nio.file.Path.of("../README.md"),
            java.nio.file.Path.of("README.md"),
            java.nio.file.Path.of("../../README.md")
        };

        for (java.nio.file.Path path : candidates) {
            if (Files.exists(path)) {
                try {
                    String content = Files.readString(path);
                    return Response.ok(content)
                        .header("Cache-Control", "public, max-age=300")
                        .build();
                } catch (IOException e) {
                    LOG.warn("Error reading README.md from " + path, e);
                }
            }
        }

        return Response.status(Response.Status.NOT_FOUND)
            .entity("README.md not found")
            .build();
    }
}
