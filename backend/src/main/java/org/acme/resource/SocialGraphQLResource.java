package org.acme.resource;

import jakarta.inject.Inject;
import org.acme.graphql.model.NotificationPage;
import org.acme.graphql.model.VoteStats;
import org.acme.model.Comment;
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

    private final VoteService voteService;
    private final CommentService commentService;
    private final NotificationService notificationService;
    private final SecurityIdentity identity;

    @Inject
    public SocialGraphQLResource(VoteService voteService, CommentService commentService,
                                  NotificationService notificationService, SecurityIdentity identity) {
        this.voteService = voteService;
        this.commentService = commentService;
        this.notificationService = notificationService;
        this.identity = identity;
    }

    // ========== Voting ==========

    @Mutation("vote")
    public VoteStats vote(@Name("entityType") String entityType,
                          @Name("entityId") String entityId,
                          @Name("rating") int rating) {
        String userId = identity.getPrincipal().getName();
        return voteService.vote(entityType, entityId, userId, rating);
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
        return commentService.addComment(entityType, entityId, userId, content);
    }

    @Mutation("addReply")
    public Comment addReply(@Name("commentId") String commentId,
                             @Name("content") String content) {
        String userId = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        return commentService.addReply(commentId, userId, content, roles);
    }

    @Mutation("deleteComment")
    public Boolean deleteComment(@Name("commentId") String commentId) {
        String userId = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        return commentService.deleteComment(commentId, userId, roles);
    }

    @Mutation("editComment")
    public Comment editComment(@Name("commentId") String commentId,
                                @Name("content") String content) {
        String userId = identity.getPrincipal().getName();
        return commentService.editComment(commentId, userId, content);
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
