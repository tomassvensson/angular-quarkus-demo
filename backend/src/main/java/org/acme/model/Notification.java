package org.acme.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.Instant;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
@DynamoDbBean
public class Notification {
    private String id;
    private String userId; // recipient
    private String type; // COMMENT, REPLY
    private String entityType; // LIST or LINK
    private String entityId;
    private String actorUsername; // who triggered the notification
    private String preview; // truncated content
    private Boolean read;
    private String targetId; // comment ID for navigation
    private Instant createdAt;

    public Notification() {
        // Required by DynamoDB Enhanced Client for deserialization
    }

    @DynamoDbPartitionKey
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }

    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
