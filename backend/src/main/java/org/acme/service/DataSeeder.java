package org.acme.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;

/**
 * Seeds DynamoDB tables with sample data for manual testing.
 * Only active when app.seed-data=true (default in dev mode).
 */
@ApplicationScoped
public class DataSeeder {

    private static final Logger LOG = Logger.getLogger(DataSeeder.class);

    @ConfigProperty(name = "app.seed-data", defaultValue = "false")
    boolean seedEnabled;

    private final LinkService linkService;
    private final CommentService commentService;
    private final VoteService voteService;

    @Inject
    public DataSeeder(LinkService linkService, CommentService commentService, VoteService voteService) {
        this.linkService = linkService;
        this.commentService = commentService;
        this.voteService = voteService;
    }

    void onStart(@Observes StartupEvent event) {
        if (!seedEnabled) {
            LOG.debug("Data seeding disabled (app.seed-data=false)");
            return;
        }

        try {
            // Only seed if tables are empty
            if (!linkService.getPublishedLists().isEmpty() || !linkService.getListsByOwner("admin.user").isEmpty()) {
                LOG.info("Data already exists, skipping seed");
                return;
            }

            LOG.info("Seeding sample data for manual testing...");
            seedData();
            LOG.info("Sample data seeded successfully");
        } catch (Exception e) {
            LOG.error("Failed to seed sample data: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("java:S1192") // Allow duplicate string literals in seed data
    private void seedData() {
        // === Admin's curated lists ===
        var javaList = linkService.createList("admin.user", "Essential Java Resources");
        var link1 = linkService.createLink("admin.user", "https://docs.oracle.com/en/java/javase/21/", "Java 21 Documentation");
        var link2 = linkService.createLink("admin.user", "https://quarkus.io/guides/", "Quarkus Guides");
        var link3 = linkService.createLink("admin.user", "https://www.baeldung.com/", "Baeldung Java Tutorials");
        javaList.setLinkIds(List.of(link1.getId(), link2.getId(), link3.getId()));
        javaList.setPublished(true);
        linkService.updateList(javaList);

        var frontendList = linkService.createList("admin.user", "Frontend Development");
        var link4 = linkService.createLink("admin.user", "https://angular.dev/", "Angular Documentation");
        var link5 = linkService.createLink("admin.user", "https://tailwindcss.com/docs", "Tailwind CSS Docs");
        var link6 = linkService.createLink("admin.user", "https://developer.mozilla.org/", "MDN Web Docs");
        frontendList.setLinkIds(List.of(link4.getId(), link5.getId(), link6.getId()));
        frontendList.setPublished(true);
        linkService.updateList(frontendList);

        // === Regular user's lists ===
        var devToolsList = linkService.createList("regular.user", "Developer Tools");
        var link7 = linkService.createLink("regular.user", "https://github.com/", "GitHub");
        var link8 = linkService.createLink("regular.user", "https://code.visualstudio.com/", "VS Code");
        var link9 = linkService.createLink("regular.user", "https://www.docker.com/", "Docker");
        devToolsList.setLinkIds(List.of(link7.getId(), link8.getId(), link9.getId()));
        devToolsList.setPublished(true);
        linkService.updateList(devToolsList);

        var privateList = linkService.createList("regular.user", "My Private Bookmarks");
        var link10 = linkService.createLink("regular.user", "https://news.ycombinator.com/", "Hacker News");
        privateList.setLinkIds(List.of(link10.getId()));
        // Not published — private list
        linkService.updateList(privateList);

        // === Owner user's content ===
        var cloudList = linkService.createList("owner.user", "Cloud & DevOps");
        var link11 = linkService.createLink("owner.user", "https://aws.amazon.com/", "Amazon Web Services");
        var link12 = linkService.createLink("owner.user", "https://terraform.io/", "Terraform by HashiCorp");
        var link13 = linkService.createLink("owner.user", "https://kubernetes.io/", "Kubernetes");
        cloudList.setLinkIds(List.of(link11.getId(), link12.getId(), link13.getId()));
        cloudList.setPublished(true);
        linkService.updateList(cloudList);

        // === Comments on published lists ===
        commentService.addComment("LIST", javaList.getId(), "regular.user",
                "Great collection of Java resources! The Quarkus guide is especially helpful.");

        commentService.addComment("LIST", javaList.getId(), "owner.user",
                "I would also recommend the Effective Java book by Joshua Bloch.");

        commentService.addComment("LIST", frontendList.getId(), "regular.user",
                "MDN is the best reference for web development. Love this list!");

        commentService.addComment("LIST", devToolsList.getId(), "admin.user",
                "Solid toolset! I'd add IntelliJ IDEA and Postman to the list.");

        commentService.addComment("LIST", cloudList.getId(), "admin.user",
                "Terraform is a game-changer for infrastructure management.");

        commentService.addComment("LIST", cloudList.getId(), "regular.user",
                "Don't forget about Pulumi as an alternative to Terraform!");

        // === Votes on published lists ===
        voteService.vote("LIST", javaList.getId(), "regular.user", 5);
        voteService.vote("LIST", javaList.getId(), "owner.user", 4);
        voteService.vote("LIST", frontendList.getId(), "regular.user", 5);
        voteService.vote("LIST", frontendList.getId(), "owner.user", 5);
        voteService.vote("LIST", devToolsList.getId(), "admin.user", 4);
        voteService.vote("LIST", devToolsList.getId(), "owner.user", 3);
        voteService.vote("LIST", cloudList.getId(), "admin.user", 5);
        voteService.vote("LIST", cloudList.getId(), "regular.user", 4);
    }
}
