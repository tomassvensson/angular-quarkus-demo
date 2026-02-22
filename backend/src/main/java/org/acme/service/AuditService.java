package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.AuditLog;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;

/**
 * Service for recording and querying audit log entries.
 * Tracks who changed what, when across all mutations.
 */
@ApplicationScoped
public class AuditService {

    private static final Logger LOG = Logger.getLogger(AuditService.class);

    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<AuditLog> auditTable;

    private static final TableSchema<AuditLog> AUDIT_SCHEMA = TableSchema.builder(AuditLog.class)
        .newItemSupplier(AuditLog::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(AuditLog::getId)
            .setter(AuditLog::setId)
            .tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("action")
            .getter(AuditLog::getAction)
            .setter(AuditLog::setAction))
        .addAttribute(String.class, a -> a.name("entityType")
            .getter(AuditLog::getEntityType)
            .setter(AuditLog::setEntityType))
        .addAttribute(String.class, a -> a.name("entityId")
            .getter(AuditLog::getEntityId)
            .setter(AuditLog::setEntityId))
        .addAttribute(String.class, a -> a.name("userId")
            .getter(AuditLog::getUserId)
            .setter(AuditLog::setUserId))
        .addAttribute(String.class, a -> a.name("details")
            .getter(AuditLog::getDetails)
            .setter(AuditLog::setDetails))
        .addAttribute(EnhancedType.of(Instant.class), a -> a.name("timestamp")
            .getter(AuditLog::getTimestamp)
            .setter(AuditLog::setTimestamp))
        .build();

    @Inject
    public AuditService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    @PostConstruct
    void init() {
        auditTable = enhancedClient.table("AuditLogs", AUDIT_SCHEMA);
        try {
            auditTable.createTable();
        } catch (Exception e) {
            LOG.debug("AuditLogs table creation skipped (may already exist): " + e.getMessage());
        }
    }

    /**
     * Record an audit log entry.
     *
     * @param action     The action performed (CREATE, UPDATE, DELETE, etc.)
     * @param entityType The type of entity affected (LIST, LINK, COMMENT, VOTE, USER)
     * @param entityId   The ID of the affected entity
     * @param userId     The user who performed the action
     * @param details    Human-readable description of what changed
     */
    public void log(String action, String entityType, String entityId, String userId, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setId(UUID.randomUUID().toString());
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setUserId(userId);
            entry.setDetails(details);
            entry.setTimestamp(Instant.now());
            auditTable.putItem(entry);
        } catch (Exception e) {
            // Audit logging should never break the main operation
            LOG.error("Failed to write audit log: " + e.getMessage(), e);
        }
    }

    /**
     * Get recent audit logs, ordered by timestamp descending.
     *
     * @param limit Maximum number of entries to return
     * @return List of recent audit log entries
     */
    public List<AuditLog> getRecentLogs(int limit) {
        int safeLimit = Math.clamp(limit, 1, 200);
        return auditTable.scan().items().stream()
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .limit(safeLimit)
                .toList();
    }

    /**
     * Get audit logs for a specific entity.
     *
     * @param entityType The type of entity
     * @param entityId   The ID of the entity
     * @return List of audit log entries for the entity
     */
    public List<AuditLog> getLogsForEntity(String entityType, String entityId) {
        return auditTable.scan().items().stream()
                .filter(l -> entityType.equals(l.getEntityType()) && entityId.equals(l.getEntityId()))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .toList();
    }

    /**
     * Get audit logs for a specific user.
     *
     * @param userId The user ID to filter by
     * @param limit  Maximum number of entries to return
     * @return List of audit log entries for the user
     */
    public List<AuditLog> getLogsForUser(String userId, int limit) {
        int safeLimit = Math.clamp(limit, 1, 200);
        return auditTable.scan().items().stream()
                .filter(l -> userId.equals(l.getUserId()))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .limit(safeLimit)
                .toList();
    }
}
