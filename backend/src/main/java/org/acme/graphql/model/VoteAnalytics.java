package org.acme.graphql.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Analytics data for votes on an entity, including rating distribution
 * and trending information.
 */
@RegisterForReflection
public class VoteAnalytics {
    private double averageRating;
    private int voteCount;
    private List<RatingEntry> ratingDistribution; // rating (1-5) -> count
    private Integer userRating; // null if user hasn't voted

    public VoteAnalytics() {}

    public VoteAnalytics(double averageRating, int voteCount,
                         List<RatingEntry> ratingDistribution,
                         Integer userRating) {
        this.averageRating = averageRating;
        this.voteCount = voteCount;
        this.ratingDistribution = ratingDistribution;
        this.userRating = userRating;
    }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public int getVoteCount() { return voteCount; }
    public void setVoteCount(int voteCount) { this.voteCount = voteCount; }

    public List<RatingEntry> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(List<RatingEntry> ratingDistribution) {
        this.ratingDistribution = ratingDistribution;
    }

    public Integer getUserRating() { return userRating; }
    public void setUserRating(Integer userRating) { this.userRating = userRating; }

    /**
     * A single entry in the rating distribution: maps a star rating to its count.
     */
    @RegisterForReflection
    public static class RatingEntry {
        private int rating;
        private int count;

        public RatingEntry() {}

        public RatingEntry(int rating, int count) {
            this.rating = rating;
            this.count = count;
        }

        public int getRating() { return rating; }
        public void setRating(int rating) { this.rating = rating; }
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }
}
