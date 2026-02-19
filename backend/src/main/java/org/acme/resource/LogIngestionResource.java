package org.acme.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.service.CloudWatchLogService;
import org.acme.service.CloudWatchLogService.FrontendLogEntry;
import org.jboss.logging.Logger;

import java.util.List;

/**
 * REST endpoint that receives log entries from the frontend
 * and forwards them to CloudWatch Logs.
 */
@Path("/api/v1/logs")
public class LogIngestionResource {

    private static final Logger LOG = Logger.getLogger(LogIngestionResource.class);

    private final CloudWatchLogService logService;

    @Inject
    public LogIngestionResource(CloudWatchLogService logService) {
        this.logService = logService;
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response ingestLogs(List<FrontendLogEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        if (entries.size() > 100) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Maximum 100 log entries per request")
                    .build();
        }

        try {
            logService.sendFrontendLogs(entries);
        } catch (Exception e) {
            LOG.error("Failed to ingest frontend logs", e);
            return Response.serverError().build();
        }

        return Response.accepted().build();
    }
}
