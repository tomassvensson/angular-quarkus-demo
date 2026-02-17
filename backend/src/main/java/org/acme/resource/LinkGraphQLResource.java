package org.acme.resource;

import jakarta.inject.Inject;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.acme.service.LinkService;
import org.eclipse.microprofile.graphql.*;
import io.quarkus.security.Authenticated;

import java.util.List;

@GraphQLApi
public class LinkGraphQLResource {

    @Inject
    LinkService linkService;

    @Query("publishedLists")
    @Authenticated
    public List<LinkList> getPublishedLists() {
        return linkService.getPublishedLists();
    }

    @Query("myLists")
    public List<LinkList> getMyLists(@Name("owner") String owner) {
        if (owner == null || owner.isEmpty()) {
            throw new IllegalArgumentException("Owner is required");
        }
        return linkService.getListsByOwner(owner);
    }

    @Query("list")
    public LinkList getList(@Name("id") String id) {
        return linkService.getList(id);
    }

    @Mutation("createList")
    public LinkList createList(@Name("owner") String owner, @Name("name") String name) {
        return linkService.createList(owner, name);
    }

    @Mutation("updateList")
    public LinkList updateList(
        @Name("id") String id, 
        @Name("name") String name, 
        @Name("published") Boolean published, 
        @Name("linkIds") List<String> linkIds) 
    {
        LinkList list = linkService.getList(id);
        if (list == null) {
            throw new IllegalArgumentException("List not found");
        }
        
        if (name != null) list.setName(name);
        if (published != null) list.setPublished(published);
        if (linkIds != null) list.setLinkIds(linkIds);
        
        linkService.updateList(list);
        return list;
    }

    @Mutation("deleteList")
    public Boolean deleteList(@Name("id") String id) {
        linkService.deleteList(id);
        return true;
    }

    @Mutation("createLink")
    public Link createLink(@Name("owner") String owner, @Name("url") String url, @Name("title") String title) {
        return linkService.createLink(owner, url, title);
    }
    
    @Query("link")
    public Link getLink(@Name("id") String id) {
        return linkService.getLink(id);
    }
    
    @Mutation("addLinkToList")
    public LinkList addLinkToList(@Name("listId") String listId, @Name("owner") String owner, @Name("url") String url, @Name("title") String title) {
        LinkList list = linkService.getList(listId);
        if (list == null) throw new IllegalArgumentException("List not found");
        
        Link link = linkService.createLink(owner, url, title);
        list.getLinkIds().add(link.getId());
        linkService.updateList(list);
        return list;
    }
    
    @Query("listDetails")
    public ListDetailsResponse getListDetails(@Name("id") String id) {
        LinkList list = linkService.getList(id);
        if (list == null) throw new IllegalArgumentException("List not found");
        
        List<Link> links = linkService.getLinksByIds(list.getLinkIds());
        return new ListDetailsResponse(list, links);
    }

    // Input/Output Types

    public static class ListDetailsResponse {
        public LinkList list;
        public List<Link> links;
        
        public ListDetailsResponse() {}
        
        public ListDetailsResponse(LinkList list, List<Link> links) {
            this.list = list;
            this.links = links;
        }
    }
}
