package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import org.acme.model.AuditLog;
import org.acme.service.AuditService;
import org.eclipse.microprofile.graphql.*;
import io.quarkus.security.Authenticated;

import java.util.List;

/**
 * GraphQL API for querying audit logs.
 * Only accessible by admin users.
 */
@GraphQLApi
@Authenticated
public class AuditGraphQLResource {

    private final AuditService auditService;

    @Inject
    public AuditGraphQLResource(AuditService auditService) {
        this.auditService = auditService;
    }

    @Query("auditLogs")
    @RolesAllowed("AdminUser")
    @Description("Get recent audit logs (admin only)")
    public List<AuditLog> getAuditLogs(@Name("limit") @DefaultValue("50") int limit) {
        return auditService.getRecentLogs(limit);
    }

    @Query("auditLogsForEntity")
    @RolesAllowed("AdminUser")
    @Description("Get audit logs for a specific entity (admin only)")
    public List<AuditLog> getAuditLogsForEntity(
            @Name("entityType") String entityType,
            @Name("entityId") String entityId) {
        return auditService.getLogsForEntity(entityType, entityId);
    }

    @Query("auditLogsForUser")
    @RolesAllowed("AdminUser")
    @Description("Get audit logs for a specific user (admin only)")
    public List<AuditLog> getAuditLogsForUser(
            @Name("userId") String userId,
            @Name("limit") @DefaultValue("50") int limit) {
        return auditService.getLogsForUser(userId, limit);
    }
}
