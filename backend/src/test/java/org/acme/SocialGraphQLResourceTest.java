package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Tests for the Social GraphQL Resource: voting, comments, and notifications.
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SocialGraphQLResourceTest {

    private static String testListId;
    private static String testCommentId;

    // --- Helper methods for GraphQL calls ---

    private String graphqlBody(String query) {
        return "{\"query\": \"" + query.replace("\"", "\\\"") + "\"}";
    }

    private String graphqlBody(String query, String variables) {
        return "{\"query\": \"" + query.replace("\"", "\\\"") + "\", \"variables\": " + variables + "}";
    }

    // --- Setup: Create a test list first ---

    @Test
    @Order(1)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void createTestList() {
        String mutation = "mutation createList($name: String) { createList(name: $name) { id name owner } }";
        String vars = "{\"name\": \"Social Test List\"}";

        testListId = given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.createList.name", is("Social Test List"))
                .body("data.createList.owner", is("owner1"))
                .extract().path("data.createList.id");
    }

    // --- Voting tests ---

    @Test
    @Order(10)
    @TestSecurity(user = "voter1", roles = {"RegularUser"})
    void testVoteOnList() {
        String mutation = "mutation Vote($entityType: String!, $entityId: String!, $rating: Int!) { vote(entityType: $entityType, entityId: $entityId, rating: $rating) { averageRating voteCount userRating } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\", \"rating\": 4}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.vote.averageRating", is(4.0f))
                .body("data.vote.voteCount", is(1))
                .body("data.vote.userRating", is(4));
    }

    @Test
    @Order(11)
    @TestSecurity(user = "voter2", roles = {"RegularUser"})
    void testSecondVoteChangesAverage() {
        String mutation = "mutation Vote($entityType: String!, $entityId: String!, $rating: Int!) { vote(entityType: $entityType, entityId: $entityId, rating: $rating) { averageRating voteCount userRating } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\", \"rating\": 2}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.vote.averageRating", is(3.0f))
                .body("data.vote.voteCount", is(2))
                .body("data.vote.userRating", is(2));
    }

    @Test
    @Order(12)
    @TestSecurity(user = "voter1", roles = {"RegularUser"})
    void testUpdateExistingVote() {
        String mutation = "mutation Vote($entityType: String!, $entityId: String!, $rating: Int!) { vote(entityType: $entityType, entityId: $entityId, rating: $rating) { averageRating voteCount userRating } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\", \"rating\": 5}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                // Average: (5 + 2) / 2 = 3.5
                .body("data.vote.averageRating", is(3.5f))
                .body("data.vote.voteCount", is(2))
                .body("data.vote.userRating", is(5));
    }

    @Test
    @Order(13)
    @TestSecurity(user = "voter1", roles = {"RegularUser"})
    void testGetVoteStats() {
        String query = "query VoteStats($entityType: String!, $entityId: String!) { voteStats(entityType: $entityType, entityId: $entityId) { averageRating voteCount userRating } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\"}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.voteStats.averageRating", is(3.5f))
                .body("data.voteStats.voteCount", is(2))
                .body("data.voteStats.userRating", is(5));
    }

    // --- Comment tests ---

    @Test
    @Order(20)
    @TestSecurity(user = "commenter1", roles = {"RegularUser"})
    void testAddComment() {
        String mutation = "mutation AddComment($entityType: String!, $entityId: String!, $content: String!) { addComment(entityType: $entityType, entityId: $entityId, content: $content) { id entityType entityId userId content parentId } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\", \"content\": \"Great list!\"}", testListId);

        testCommentId = given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.addComment.userId", is("commenter1"))
                .body("data.addComment.content", is("Great list!"))
                .body("data.addComment.parentId", nullValue())
                .extract().path("data.addComment.id");
    }

    @Test
    @Order(21)
    @TestSecurity(user = "commenter1", roles = {"RegularUser"})
    void testDuplicateTopLevelCommentFails() {
        String mutation = "mutation AddComment($entityType: String!, $entityId: String!, $content: String!) { addComment(entityType: $entityType, entityId: $entityId, content: $content) { id } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\", \"content\": \"Second comment attempt\"}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("errors", not(empty()));
    }

    @Test
    @Order(22)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void testOwnerCanReply() {
        String mutation = "mutation AddReply($commentId: String!, $content: String!) { addReply(commentId: $commentId, content: $content) { id userId content parentId } }";
        String vars = String.format("{\"commentId\": \"%s\", \"content\": \"Thanks for the feedback!\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.addReply.userId", is("owner1"))
                .body("data.addReply.content", is("Thanks for the feedback!"))
                .body("data.addReply.parentId", is(testCommentId));
    }

    @Test
    @Order(23)
    @TestSecurity(user = "commenter1", roles = {"RegularUser"})
    void testOriginalPosterCanReply() {
        String mutation = "mutation AddReply($commentId: String!, $content: String!) { addReply(commentId: $commentId, content: $content) { id userId } }";
        String vars = String.format("{\"commentId\": \"%s\", \"content\": \"A follow-up reply.\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.addReply.userId", is("commenter1"));
    }

    @Test
    @Order(24)
    @TestSecurity(user = "randomUser", roles = {"RegularUser"})
    void testUnauthorizedUserCannotReply() {
        String mutation = "mutation AddReply($commentId: String!, $content: String!) { addReply(commentId: $commentId, content: $content) { id } }";
        String vars = String.format("{\"commentId\": \"%s\", \"content\": \"Should fail\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("errors", not(empty()));
    }

    @Test
    @Order(25)
    @TestSecurity(user = "adminUser", roles = {"AdminUser"})
    void testAdminCanReply() {
        String mutation = "mutation AddReply($commentId: String!, $content: String!) { addReply(commentId: $commentId, content: $content) { id userId } }";
        String vars = String.format("{\"commentId\": \"%s\", \"content\": \"Admin response.\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.addReply.userId", is("adminUser"));
    }

    @Test
    @Order(26)
    @TestSecurity(user = "commenter1", roles = {"RegularUser"})
    void testGetComments() {
        String query = "query Comments($entityType: String!, $entityId: String!) { comments(entityType: $entityType, entityId: $entityId) { id userId content replies { id userId content } } }";
        String vars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\"}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.comments", hasSize(1))
                .body("data.comments[0].userId", is("commenter1"))
                .body("data.comments[0].replies", hasSize(3));
    }

    // --- Notification tests ---

    @Test
    @Order(30)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void testOwnerHasNotifications() {
        // Owner1 should have received notifications when commenter1 posted a comment
        String query = "query { unreadNotificationCount }";

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.unreadNotificationCount", greaterThan(0));
    }

    @Test
    @Order(31)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void testGetNotificationsList() {
        String query = "query Notifications($page: Int, $size: Int) { notifications(page: $page, size: $size) { items { id type actorUsername preview read } total unreadCount } }";
        String vars = "{\"page\": 0, \"size\": 10}";

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.notifications.items", not(empty()))
                .body("data.notifications.total", greaterThan(0))
                .body("data.notifications.unreadCount", greaterThan(0))
                .body("data.notifications.items[0].read", is(false));
    }

    @Test
    @Order(32)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void testMarkNotificationRead() {
        // First, get a notification ID
        String query = "query { notifications(page: 0, size: 1) { items { id read } } }";
        String notifId = given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .extract().path("data.notifications.items[0].id");

        // Mark it as read
        String mutation = "mutation MarkRead($id: String!) { markNotificationRead(id: $id) }";
        String vars = String.format("{\"id\": \"%s\"}", notifId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.markNotificationRead", is(true));
    }

    @Test
    @Order(33)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void testMarkAllNotificationsRead() {
        String mutation = "mutation { markAllNotificationsRead }";

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.markAllNotificationsRead", is(true));

        // Verify unread count is now 0
        String query = "query { unreadNotificationCount }";
        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.unreadNotificationCount", is(0));
    }

    // --- Delete comment tests ---

    @Test
    @Order(40)
    @TestSecurity(user = "randomUser", roles = {"RegularUser"})
    void testUnauthorizedDeleteFails() {
        String mutation = "mutation DeleteComment($commentId: String!) { deleteComment(commentId: $commentId) }";
        String vars = String.format("{\"commentId\": \"%s\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("errors", not(empty()));
    }

    @Test
    @Order(41)
    @TestSecurity(user = "adminUser", roles = {"AdminUser"})
    void testAdminCanDeleteComment() {
        // Admin should be able to delete any comment
        String mutation = "mutation DeleteComment($commentId: String!) { deleteComment(commentId: $commentId) }";
        String vars = String.format("{\"commentId\": \"%s\"}", testCommentId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.deleteComment", is(true));

        // Verify comment is gone
        String query = "query Comments($entityType: String!, $entityId: String!) { comments(entityType: $entityType, entityId: $entityId) { id } }";
        String queryVars = String.format("{\"entityType\": \"LIST\", \"entityId\": \"%s\"}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(query, queryVars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.comments", empty());
    }

    // --- README tests ---

    @Test
    @Order(50)
    void testReadmeEndpoint() {
        given()
            .when().get("/api/v1/readme")
            .then()
                .statusCode(anyOf(is(200), is(404)));
        // Returns 200 if README.md is found, 404 otherwise (depends on working dir)
    }

    // --- Cleanup ---

    @Test
    @Order(99)
    @TestSecurity(user = "owner1", roles = {"RegularUser"})
    void cleanupTestList() {
        if (testListId == null) return;
        
        String mutation = "mutation deleteList($id: String) { deleteList(id: $id) }";
        String vars = String.format("{\"id\": \"%s\"}", testListId);

        given()
            .contentType(ContentType.JSON)
            .body(graphqlBody(mutation, vars))
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200);
    }
}
