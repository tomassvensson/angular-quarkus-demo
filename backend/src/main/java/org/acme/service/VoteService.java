package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.graphql.model.VoteStats;
import org.acme.model.Vote;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;

@ApplicationScoped
public class VoteService {

    private static final Logger LOG = Logger.getLogger(VoteService.class);
    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<Vote> voteTable;

    @Inject
    public VoteService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    private static final TableSchema<Vote> VOTE_SCHEMA = TableSchema.builder(Vote.class)
        .newItemSupplier(Vote::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(Vote::getId).setter(Vote::setId).tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("entityType")
            .getter(Vote::getEntityType).setter(Vote::setEntityType))
        .addAttribute(String.class, a -> a.name("entityId")
            .getter(Vote::getEntityId).setter(Vote::setEntityId))
        .addAttribute(String.class, a -> a.name("userId")
            .getter(Vote::getUserId).setter(Vote::setUserId))
        .addAttribute(Integer.class, a -> a.name("rating")
            .getter(Vote::getRating).setter(Vote::setRating))
        .addAttribute(Instant.class, a -> a.name("createdAt")
            .getter(Vote::getCreatedAt).setter(Vote::setCreatedAt))
        .addAttribute(Instant.class, a -> a.name("updatedAt")
            .getter(Vote::getUpdatedAt).setter(Vote::setUpdatedAt))
        .build();

    @PostConstruct
    void init() {
        voteTable = enhancedClient.table("Votes", VOTE_SCHEMA);
        try {
            voteTable.createTable();
        } catch (Exception e) {
            LOG.debug("Votes table creation skipped (may already exist): " + e.getMessage());
        }
    }

    /**
     * Create or update a vote. Returns updated vote stats.
     */
    public VoteStats vote(String entityType, String entityId, String userId, int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Vote existing = findVote(entityType, entityId, userId);
        Instant now = Instant.now();

        if (existing != null) {
            existing.setRating(rating);
            existing.setUpdatedAt(now);
            voteTable.updateItem(existing);
        } else {
            Vote vote = new Vote();
            vote.setId(UUID.randomUUID().toString());
            vote.setEntityType(entityType);
            vote.setEntityId(entityId);
            vote.setUserId(userId);
            vote.setRating(rating);
            vote.setCreatedAt(now);
            vote.setUpdatedAt(now);
            voteTable.putItem(vote);
        }

        return getVoteStats(entityType, entityId, userId);
    }

    /**
     * Get vote statistics for an entity, including the current user's rating.
     */
    public VoteStats getVoteStats(String entityType, String entityId, String userId) {
        List<Vote> votes = getVotesForEntity(entityType, entityId);

        if (votes.isEmpty()) {
            return new VoteStats(0.0, 0, null);
        }

        double avg = votes.stream()
            .mapToInt(Vote::getRating)
            .average()
            .orElse(0.0);

        // Round to 1 decimal
        avg = Math.round(avg * 10.0) / 10.0;

        Integer userRating = votes.stream()
            .filter(v -> userId.equals(v.getUserId()))
            .map(Vote::getRating)
            .findFirst()
            .orElse(null);

        return new VoteStats(avg, votes.size(), userRating);
    }

    private List<Vote> getVotesForEntity(String entityType, String entityId) {
        return voteTable.scan().items().stream()
            .filter(v -> entityType.equals(v.getEntityType()) && entityId.equals(v.getEntityId()))
            .toList();
    }

    private Vote findVote(String entityType, String entityId, String userId) {
        return voteTable.scan().items().stream()
            .filter(v -> entityType.equals(v.getEntityType())
                && entityId.equals(v.getEntityId())
                && userId.equals(v.getUserId()))
            .findFirst()
            .orElse(null);
    }
}
