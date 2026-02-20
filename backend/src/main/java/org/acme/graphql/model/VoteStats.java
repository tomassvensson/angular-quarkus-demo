package org.acme.graphql.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class VoteStats {
    private double averageRating;
    private int voteCount;
    private Integer userRating; // null if user hasn't voted

    public VoteStats() {}

    public VoteStats(double averageRating, int voteCount, Integer userRating) {
        this.averageRating = averageRating;
        this.voteCount = voteCount;
        this.userRating = userRating;
    }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public int getVoteCount() { return voteCount; }
    public void setVoteCount(int voteCount) { this.voteCount = voteCount; }

    public Integer getUserRating() { return userRating; }
    public void setUserRating(Integer userRating) { this.userRating = userRating; }
}
