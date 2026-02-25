package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.graphql.model.VoteAnalytics;
import org.acme.graphql.model.VoteStats;
import org.acme.model.Vote;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;
import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.secondaryPartitionKey;

@ApplicationScoped
public class VoteService {

    private static final Logger LOG = Logger.getLogger(VoteService.class);
    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<Vote> voteTable;
    private DynamoDbIndex<Vote> entityIndex;

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
            .getter(Vote::getEntityId).setter(Vote::setEntityId)
            .tags(secondaryPartitionKey("EntityIndex")))
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
        entityIndex = voteTable.index("EntityIndex");
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

    /**
     * Get detailed vote analytics for an entity, including rating distribution.
     */
    public VoteAnalytics getVoteAnalytics(String entityType, String entityId, String userId) {
        List<Vote> votes = getVotesForEntity(entityType, entityId);

        // Build rating distribution (1-5)
        int[] counts = new int[6]; // index 0 unused, 1-5 for star ratings
        for (Vote v : votes) {
            int r = v.getRating();
            if (r >= 1 && r <= 5) {
                counts[r]++;
            }
        }
        List<VoteAnalytics.RatingEntry> distribution = new ArrayList<>(5);
        for (int i = 1; i <= 5; i++) {
            distribution.add(new VoteAnalytics.RatingEntry(i, counts[i]));
        }

        if (votes.isEmpty()) {
            return new VoteAnalytics(0.0, 0, distribution, null);
        }

        double avg = votes.stream()
            .mapToInt(Vote::getRating)
            .average()
            .orElse(0.0);
        avg = Math.round(avg * 10.0) / 10.0;

        Integer userRating = votes.stream()
            .filter(v -> userId.equals(v.getUserId()))
            .map(Vote::getRating)
            .findFirst()
            .orElse(null);

        return new VoteAnalytics(avg, votes.size(), distribution, userRating);
    }

    private List<Vote> getVotesForEntity(String entityType, String entityId) {
        // Use EntityIndex GSI to query by entityId, then filter by entityType in memory
        return entityIndex.query(QueryConditional.keyEqualTo(
                Key.builder().partitionValue(entityId).build()))
            .stream()
            .flatMap(page -> page.items().stream())
            .filter(v -> entityType.equals(v.getEntityType()))
            .toList();
    }

    private Vote findVote(String entityType, String entityId, String userId) {
        return getVotesForEntity(entityType, entityId).stream()
            .filter(v -> userId.equals(v.getUserId()))
            .findFirst()
            .orElse(null);
    }
}
