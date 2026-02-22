package org.acme.service;

import io.quarkus.runtime.StartupEvent;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for DataSeeder.
 */
class DataSeederTest {

    private DataSeeder seeder;
    private LinkService linkService;
    private CommentService commentService;
    private VoteService voteService;

    @BeforeEach
    void setUp() throws Exception {
        linkService = mock(LinkService.class);
        commentService = mock(CommentService.class);
        voteService = mock(VoteService.class);
        seeder = new DataSeeder(linkService, commentService, voteService);

        // Default: seeding enabled
        setField("seedEnabled", true);

        // Make createList/createLink return objects with IDs
        when(linkService.createList(anyString(), anyString())).thenAnswer(inv -> {
            LinkList list = new LinkList();
            list.setId(UUID.randomUUID().toString());
            list.setOwner(inv.getArgument(0));
            list.setName(inv.getArgument(1));
            list.setLinkIds(new ArrayList<>());
            return list;
        });
        when(linkService.createLink(anyString(), anyString(), anyString())).thenAnswer(inv -> {
            Link link = new Link();
            link.setId(UUID.randomUUID().toString());
            link.setOwner(inv.getArgument(0));
            link.setUrl(inv.getArgument(1));
            link.setTitle(inv.getArgument(2));
            return link;
        });

        // Empty tables by default
        when(linkService.getPublishedLists()).thenReturn(List.of());
        when(linkService.getListsByOwner(anyString())).thenReturn(List.of());
    }

    @Test
    void seedsDataWhenTablesAreEmpty() {
        seeder.onStart(new StartupEvent());

        // Should create 5 lists
        verify(linkService, times(5)).createList(anyString(), anyString());
        // Should create 13 links
        verify(linkService, times(13)).createLink(anyString(), anyString(), anyString());
        // Should create 6 comments
        verify(commentService, times(6)).addComment(anyString(), anyString(), anyString(), anyString());
        // Should create 8 votes
        verify(voteService, times(8)).vote(anyString(), anyString(), anyString(), anyInt());
    }

    @Test
    void skipsWhenDisabled() throws Exception {
        setField("seedEnabled", false);
        seeder.onStart(new StartupEvent());

        verify(linkService, never()).createList(anyString(), anyString());
    }

    @Test
    void skipsWhenDataExists() {
        LinkList existing = new LinkList();
        existing.setId("existing");
        when(linkService.getPublishedLists()).thenReturn(List.of(existing));

        seeder.onStart(new StartupEvent());

        verify(linkService, never()).createList(anyString(), anyString());
    }

    @Test
    void handlesErrorGracefully() {
        when(linkService.createList(anyString(), anyString())).thenThrow(new RuntimeException("DynamoDB down"));

        assertDoesNotThrow(() -> seeder.onStart(new StartupEvent()));
    }

    private void setField(String name, Object value) throws Exception {
        Field field = DataSeeder.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(seeder, value);
    }
}
