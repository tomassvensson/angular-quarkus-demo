package org.acme.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.Instant;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Represents an audit log entry tracking who changed what and when.
 * Stored in a DynamoDB table named "AuditLogs".
 */
@RegisterForReflection
@DynamoDbBean
public class AuditLog {
    private String id;
    private String action;      // CREATE, UPDATE, DELETE, LOGIN, PASSWORD_CHANGE, etc.
    private String entityType;  // LIST, LINK, COMMENT, VOTE, USER
    private String entityId;
    private String userId;
    private String details;     // JSON or human-readable description of the change
    private Instant timestamp;

    public AuditLog() {
        // Required by DynamoDB Enhanced Client for deserialization
    }

    @DynamoDbPartitionKey
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
