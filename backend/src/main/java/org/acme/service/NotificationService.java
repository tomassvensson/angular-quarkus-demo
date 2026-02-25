package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.graphql.model.NotificationPage;
import org.acme.model.Notification;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;
import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.secondaryPartitionKey;

@ApplicationScoped
public class NotificationService {

    private static final Logger LOG = Logger.getLogger(NotificationService.class);
    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<Notification> notificationTable;
    private DynamoDbIndex<Notification> userIndex;

    @Inject
    public NotificationService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    private static final TableSchema<Notification> NOTIFICATION_SCHEMA = TableSchema.builder(Notification.class)
        .newItemSupplier(Notification::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(Notification::getId).setter(Notification::setId).tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("userId")
            .getter(Notification::getUserId).setter(Notification::setUserId)
            .tags(secondaryPartitionKey("UserIndex")))
        .addAttribute(String.class, a -> a.name("type")
            .getter(Notification::getType).setter(Notification::setType))
        .addAttribute(String.class, a -> a.name("entityType")
            .getter(Notification::getEntityType).setter(Notification::setEntityType))
        .addAttribute(String.class, a -> a.name("entityId")
            .getter(Notification::getEntityId).setter(Notification::setEntityId))
        .addAttribute(String.class, a -> a.name("actorUsername")
            .getter(Notification::getActorUsername).setter(Notification::setActorUsername))
        .addAttribute(String.class, a -> a.name("preview")
            .getter(Notification::getPreview).setter(Notification::setPreview))
        .addAttribute(Boolean.class, a -> a.name("read")
            .getter(Notification::getRead).setter(Notification::setRead))
        .addAttribute(String.class, a -> a.name("targetId")
            .getter(Notification::getTargetId).setter(Notification::setTargetId))
        .addAttribute(Instant.class, a -> a.name("createdAt")
            .getter(Notification::getCreatedAt).setter(Notification::setCreatedAt))
        .build();

    @PostConstruct
    void init() {
        notificationTable = enhancedClient.table("Notifications", NOTIFICATION_SCHEMA);
        userIndex = notificationTable.index("UserIndex");
        try {
            notificationTable.createTable();
        } catch (Exception e) {
            LOG.debug("Notifications table creation skipped (may already exist): " + e.getMessage());
        }
    }

    public void createNotification(String userId, String type, String entityType, String entityId,
                                    String actorUsername, String preview, String targetId) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(userId);
        notification.setType(type);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setActorUsername(actorUsername);
        notification.setPreview(preview);
        notification.setRead(false);
        notification.setTargetId(targetId);
        notification.setCreatedAt(Instant.now());
        notificationTable.putItem(notification);
    }

    public NotificationPage getNotifications(String userId, int page, int size) {
        List<Notification> userNotifications = new java.util.ArrayList<>(getUserNotifications(userId));

        int total = userNotifications.size();
        int unreadCount = (int) userNotifications.stream()
            .filter(n -> !Boolean.TRUE.equals(n.getRead()))
            .count();

        // Sort by createdAt descending (newest first)
        userNotifications.sort(Comparator.comparing(Notification::getCreatedAt).reversed());

        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);

        return new NotificationPage(
            userNotifications.subList(fromIndex, toIndex),
            total,
            unreadCount
        );
    }

    public int getUnreadCount(String userId) {
        return (int) getUserNotifications(userId).stream()
            .filter(n -> !Boolean.TRUE.equals(n.getRead()))
            .count();
    }

    public boolean markRead(String notificationId, String userId) {
        Notification notification = notificationTable.getItem(r -> r.key(k -> k.partitionValue(notificationId)));
        if (notification == null || !userId.equals(notification.getUserId())) {
            return false;
        }
        notification.setRead(true);
        notificationTable.updateItem(notification);
        return true;
    }

    public boolean markAllRead(String userId) {
        getUserNotifications(userId).stream()
            .filter(n -> !Boolean.TRUE.equals(n.getRead()))
            .forEach(n -> {
                n.setRead(true);
                notificationTable.updateItem(n);
            });
        return true;
    }

    private List<Notification> getUserNotifications(String userId) {
        // Use UserIndex GSI to query by userId instead of scanning the entire table
        return userIndex.query(QueryConditional.keyEqualTo(
                Key.builder().partitionValue(userId).build()))
            .stream()
            .flatMap(page -> page.items().stream())
            .toList();
    }
}
