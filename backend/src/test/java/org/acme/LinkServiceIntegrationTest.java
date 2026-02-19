package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.acme.service.LinkService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test for {@link LinkService} using DynamoDB DevServices (Testcontainers).
 */
@QuarkusTest
class LinkServiceIntegrationTest {

    @Inject
    LinkService linkService;

    @Test
    void testCreateAndGetList() {
        LinkList list = linkService.createList("integration-user", "Integration Test List");

        assertNotNull(list.getId());
        assertEquals("integration-user", list.getOwner());
        assertEquals("Integration Test List", list.getName());
        assertFalse(list.getPublished());
        assertNotNull(list.getCreatedAt());
        assertNotNull(list.getUpdatedAt());

        LinkList fetched = linkService.getList(list.getId());
        assertNotNull(fetched);
        assertEquals(list.getId(), fetched.getId());
        assertEquals("Integration Test List", fetched.getName());
    }

    @Test
    void testGetListsByOwner() {
        String owner = "owner-filter-test-" + System.nanoTime();
        linkService.createList(owner, "List A");
        linkService.createList(owner, "List B");
        linkService.createList("other-owner", "Not Mine");

        List<LinkList> lists = linkService.getListsByOwner(owner);
        assertEquals(2, lists.size());
        assertTrue(lists.stream().allMatch(l -> owner.equals(l.getOwner())));
    }

    @Test
    void testPublishedLists() {
        String owner = "published-test-" + System.nanoTime();
        LinkList unpublished = linkService.createList(owner, "Private List");
        LinkList published = linkService.createList(owner, "Public List");
        published.setPublished(true);
        linkService.updateList(published);

        List<LinkList> publishedLists = linkService.getPublishedLists();
        assertTrue(publishedLists.stream().anyMatch(l -> l.getId().equals(published.getId())));
        assertFalse(publishedLists.stream().anyMatch(l -> l.getId().equals(unpublished.getId())));
    }

    @Test
    void testUpdateList() {
        LinkList list = linkService.createList("update-user", "Original Name");
        list.setName("Updated Name");
        list.setPublished(true);
        linkService.updateList(list);

        LinkList updated = linkService.getList(list.getId());
        assertEquals("Updated Name", updated.getName());
        assertTrue(updated.getPublished());
    }

    @Test
    void testDeleteList() {
        LinkList list = linkService.createList("delete-user", "To Be Deleted");
        String id = list.getId();

        assertNotNull(linkService.getList(id));
        linkService.deleteList(id);
        assertNull(linkService.getList(id));
    }

    @Test
    void testCreateAndGetLink() {
        Link link = linkService.createLink("link-user", "https://example.com", "Example");

        assertNotNull(link.getId());
        assertEquals("link-user", link.getOwner());
        assertEquals("https://example.com", link.getUrl());
        assertEquals("Example", link.getTitle());
        assertNotNull(link.getCreatedAt());

        Link fetched = linkService.getLink(link.getId());
        assertNotNull(fetched);
        assertEquals(link.getId(), fetched.getId());
        assertEquals("https://example.com", fetched.getUrl());
    }

    @Test
    void testGetLinksByIds() {
        Link link1 = linkService.createLink("bulk-user", "https://a.com", "A");
        Link link2 = linkService.createLink("bulk-user", "https://b.com", "B");

        List<Link> links = linkService.getLinksByIds(List.of(link1.getId(), link2.getId()));
        assertEquals(2, links.size());
    }

    @Test
    void testListWithLinks() {
        LinkList list = linkService.createList("full-flow-user", "Full Flow List");
        Link link = linkService.createLink("full-flow-user", "https://full.com", "Full");

        list.getLinkIds().add(link.getId());
        linkService.updateList(list);

        LinkList updated = linkService.getList(list.getId());
        assertEquals(1, updated.getLinkIds().size());
        assertEquals(link.getId(), updated.getLinkIds().get(0));

        List<Link> resolvedLinks = linkService.getLinksByIds(updated.getLinkIds());
        assertEquals(1, resolvedLinks.size());
        assertEquals("https://full.com", resolvedLinks.get(0).getUrl());
    }

    @Test
    void testGetNonexistentList() {
        assertNull(linkService.getList("nonexistent-id-" + System.nanoTime()));
    }
}
