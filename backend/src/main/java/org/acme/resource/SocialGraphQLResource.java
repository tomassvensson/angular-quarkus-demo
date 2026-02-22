package org.acme.resource;

import jakarta.inject.Inject;
import org.acme.graphql.model.NotificationPage;
import org.acme.graphql.model.VoteStats;
import org.acme.model.Comment;
import org.acme.service.AuditService;
import org.acme.service.CommentService;
import org.acme.service.NotificationService;
import org.acme.service.VoteService;
import org.eclipse.microprofile.graphql.*;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;

import java.util.List;
import java.util.Set;

@GraphQLApi
@Authenticated
public class SocialGraphQLResource {

    private static final String ENTITY_COMMENT = "COMMENT";

    private final VoteService voteService;
    private final CommentService commentService;
    private final NotificationService notificationService;
    private final SecurityIdentity identity;
    private final AuditService auditService;

    @Inject
    public SocialGraphQLResource(VoteService voteService, CommentService commentService,
                                  NotificationService notificationService, SecurityIdentity identity,
                                  AuditService auditService) {
        this.voteService = voteService;
        this.commentService = commentService;
        this.notificationService = notificationService;
        this.identity = identity;
        this.auditService = auditService;
    }

    // ========== Voting ==========

    @Mutation("vote")
    public VoteStats vote(@Name("entityType") String entityType,
                          @Name("entityId") String entityId,
                          @Name("rating") int rating) {
        String userId = identity.getPrincipal().getName();
        VoteStats result = voteService.vote(entityType, entityId, userId, rating);
        auditService.log("VOTE", entityType, entityId, userId, "Rated " + rating + " stars");
        return result;
    }

    @Query("voteStats")
    public VoteStats getVoteStats(@Name("entityType") String entityType,
                                   @Name("entityId") String entityId) {
        String userId = identity.getPrincipal().getName();
        return voteService.getVoteStats(entityType, entityId, userId);
    }

    // ========== Comments ==========

    @Query("comments")
    public List<Comment> getComments(@Name("entityType") String entityType,
                                      @Name("entityId") String entityId) {
        return commentService.getCommentsTree(entityType, entityId);
    }

    @Mutation("addComment")
    public Comment addComment(@Name("entityType") String entityType,
                               @Name("entityId") String entityId,
                               @Name("content") String content) {
        String userId = identity.getPrincipal().getName();
        Comment created = commentService.addComment(entityType, entityId, userId, content);
        auditService.log("CREATE", ENTITY_COMMENT, created.getId(), userId, "Commented on " + entityType + " " + entityId);
        return created;
    }

    @Mutation("addReply")
    public Comment addReply(@Name("commentId") String commentId,
                             @Name("content") String content) {
        String userId = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        Comment reply = commentService.addReply(commentId, userId, content, roles);
        auditService.log("REPLY", ENTITY_COMMENT, commentId, userId, "Replied to comment");
        return reply;
    }

    @Mutation("deleteComment")
    public Boolean deleteComment(@Name("commentId") String commentId) {
        String userId = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        Boolean result = commentService.deleteComment(commentId, userId, roles);
        if (Boolean.TRUE.equals(result)) {
            auditService.log("DELETE", ENTITY_COMMENT, commentId, userId, "Deleted comment");
        }
        return result;
    }

    @Mutation("editComment")
    public Comment editComment(@Name("commentId") String commentId,
                                @Name("content") String content) {
        String userId = identity.getPrincipal().getName();
        Comment edited = commentService.editComment(commentId, userId, content);
        auditService.log("UPDATE", ENTITY_COMMENT, commentId, userId, "Edited comment");
        return edited;
    }

    // ========== Notifications ==========

    @Query("notifications")
    public NotificationPage getNotifications(
            @Name("page") @DefaultValue("0") int page,
            @Name("size") @DefaultValue("20") int size) {
        String userId = identity.getPrincipal().getName();
        int safePage = Math.max(0, page);
        int safeSize = Math.clamp(size, 1, 100);
        return notificationService.getNotifications(userId, safePage, safeSize);
    }

    @Query("unreadNotificationCount")
    public int getUnreadNotificationCount() {
        String userId = identity.getPrincipal().getName();
        return notificationService.getUnreadCount(userId);
    }

    @Mutation("markNotificationRead")
    public Boolean markNotificationRead(@Name("id") String id) {
        String userId = identity.getPrincipal().getName();
        return notificationService.markRead(id, userId);
    }

    @Mutation("markAllNotificationsRead")
    public Boolean markAllNotificationsRead() {
        String userId = identity.getPrincipal().getName();
        return notificationService.markAllRead(userId);
    }
}
