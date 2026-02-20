package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.Comment;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;

@ApplicationScoped
public class CommentService {

    private static final Logger LOG = Logger.getLogger(CommentService.class);
    private static final int MAX_PREVIEW_LENGTH = 100;

    private final DynamoDbEnhancedClient enhancedClient;
    private final LinkService linkService;
    private final NotificationService notificationService;
    private DynamoDbTable<Comment> commentTable;

    @Inject
    public CommentService(DynamoDbEnhancedClient enhancedClient, LinkService linkService,
                          NotificationService notificationService) {
        this.enhancedClient = enhancedClient;
        this.linkService = linkService;
        this.notificationService = notificationService;
    }

    private static final TableSchema<Comment> COMMENT_SCHEMA = TableSchema.builder(Comment.class)
        .newItemSupplier(Comment::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(Comment::getId).setter(Comment::setId).tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("entityType")
            .getter(Comment::getEntityType).setter(Comment::setEntityType))
        .addAttribute(String.class, a -> a.name("entityId")
            .getter(Comment::getEntityId).setter(Comment::setEntityId))
        .addAttribute(String.class, a -> a.name("userId")
            .getter(Comment::getUserId).setter(Comment::setUserId))
        .addAttribute(String.class, a -> a.name("content")
            .getter(Comment::getContent).setter(Comment::setContent))
        .addAttribute(String.class, a -> a.name("parentId")
            .getter(Comment::getParentId).setter(Comment::setParentId))
        .addAttribute(Instant.class, a -> a.name("createdAt")
            .getter(Comment::getCreatedAt).setter(Comment::setCreatedAt))
        .addAttribute(Instant.class, a -> a.name("updatedAt")
            .getter(Comment::getUpdatedAt).setter(Comment::setUpdatedAt))
        .build();

    @PostConstruct
    void init() {
        commentTable = enhancedClient.table("Comments", COMMENT_SCHEMA);
        try {
            commentTable.createTable();
        } catch (Exception e) {
            LOG.debug("Comments table creation skipped (may already exist): " + e.getMessage());
        }
    }

    /**
     * Add a top-level comment. Enforces one top-level comment per user per entity.
     */
    public Comment addComment(String entityType, String entityId, String userId, String content) {
        // Check if user already has a top-level comment on this entity
        boolean alreadyCommented = getCommentsForEntity(entityType, entityId).stream()
            .anyMatch(c -> c.getParentId() == null && userId.equals(c.getUserId()));

        if (alreadyCommented) {
            throw new IllegalStateException("You have already posted a comment on this item");
        }

        Comment comment = new Comment();
        comment.setId(UUID.randomUUID().toString());
        comment.setEntityType(entityType);
        comment.setEntityId(entityId);
        comment.setUserId(userId);
        comment.setContent(content);
        Instant now = Instant.now();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        commentTable.putItem(comment);

        // Notify: entity owner and other commenters on this entity
        notifyParticipants(entityType, entityId, userId, content, comment.getId(), "COMMENT");

        return comment;
    }

    /**
     * Add a reply to a comment. Only the entity owner or the parent comment's author can reply.
     */
    public Comment addReply(String commentId, String userId, String content, Set<String> userRoles) {
        Comment parent = getComment(commentId);
        if (parent == null) {
            throw new IllegalArgumentException("Parent comment not found");
        }

        // Check authorization: only entity owner or parent comment author (or admin) can reply
        String entityOwner = getEntityOwner(parent.getEntityType(), parent.getEntityId());
        boolean isOwner = userId.equals(entityOwner);
        boolean isOriginalPoster = userId.equals(parent.getUserId());
        boolean isAdmin = userRoles.contains("AdminUser") || userRoles.contains("admin");

        if (!isOwner && !isOriginalPoster && !isAdmin) {
            throw new SecurityException("Only the entity owner or the comment author can reply");
        }

        Comment reply = new Comment();
        reply.setId(UUID.randomUUID().toString());
        reply.setEntityType(parent.getEntityType());
        reply.setEntityId(parent.getEntityId());
        reply.setUserId(userId);
        reply.setContent(content);
        reply.setParentId(commentId);
        Instant now = Instant.now();
        reply.setCreatedAt(now);
        reply.setUpdatedAt(now);
        commentTable.putItem(reply);

        // Notify participants
        notifyParticipants(parent.getEntityType(), parent.getEntityId(), userId, content,
            reply.getId(), "REPLY");

        return reply;
    }

    /**
     * Delete a comment (and its replies). Only the poster or an admin can delete.
     */
    public boolean deleteComment(String commentId, String userId, Set<String> userRoles) {
        Comment comment = getComment(commentId);
        if (comment == null) {
            return false;
        }

        boolean isPoster = userId.equals(comment.getUserId());
        boolean isAdmin = userRoles.contains("AdminUser") || userRoles.contains("admin");

        if (!isPoster && !isAdmin) {
            throw new SecurityException("Only the poster or an admin can delete this comment");
        }

        // Delete replies first
        getCommentsForEntity(comment.getEntityType(), comment.getEntityId()).stream()
            .filter(c -> commentId.equals(c.getParentId()))
            .forEach(c -> commentTable.deleteItem(r -> r.key(k -> k.partitionValue(c.getId()))));

        // Delete the comment itself
        commentTable.deleteItem(r -> r.key(k -> k.partitionValue(commentId)));
        return true;
    }

    /**
     * Get all comments for an entity, structured as a tree (top-level with nested replies).
     */
    public List<Comment> getCommentsTree(String entityType, String entityId) {
        List<Comment> all = getCommentsForEntity(entityType, entityId);

        Map<String, List<Comment>> repliesByParent = all.stream()
            .filter(c -> c.getParentId() != null)
            .collect(Collectors.groupingBy(Comment::getParentId));

        List<Comment> topLevel = all.stream()
            .filter(c -> c.getParentId() == null)
            .sorted(Comparator.comparing(Comment::getCreatedAt))
            .toList();

        for (Comment c : topLevel) {
            List<Comment> replies = new ArrayList<>(repliesByParent.getOrDefault(c.getId(), List.of()));
            replies.sort(Comparator.comparing(Comment::getCreatedAt));
            c.setReplies(replies);
        }

        return topLevel;
    }

    public Comment getComment(String id) {
        return commentTable.getItem(r -> r.key(k -> k.partitionValue(id)));
    }

    private List<Comment> getCommentsForEntity(String entityType, String entityId) {
        return commentTable.scan().items().stream()
            .filter(c -> entityType.equals(c.getEntityType()) && entityId.equals(c.getEntityId()))
            .toList();
    }

    private String getEntityOwner(String entityType, String entityId) {
        if ("LIST".equals(entityType)) {
            LinkList list = linkService.getList(entityId);
            return list != null ? list.getOwner() : null;
        } else if ("LINK".equals(entityType)) {
            Link link = linkService.getLink(entityId);
            return link != null ? link.getOwner() : null;
        }
        return null;
    }

    private void notifyParticipants(String entityType, String entityId, String actorUserId,
                                     String content, String targetId, String type) {
        String preview = content.length() > MAX_PREVIEW_LENGTH
            ? content.substring(0, MAX_PREVIEW_LENGTH) + "..."
            : content;

        // Collect all participants: entity owner + all commenters on this entity
        Set<String> participants = new HashSet<>();

        String entityOwner = getEntityOwner(entityType, entityId);
        if (entityOwner != null) {
            participants.add(entityOwner);
        }

        getCommentsForEntity(entityType, entityId).stream()
            .map(Comment::getUserId)
            .forEach(participants::add);

        // Remove the actor (don't notify yourself)
        participants.remove(actorUserId);

        // Create notifications for all participants
        for (String recipientUserId : participants) {
            notificationService.createNotification(
                recipientUserId, type, entityType, entityId,
                actorUserId, preview, targetId
            );
        }
    }
}
