package org.acme.resource;

import jakarta.inject.Inject;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.acme.service.LinkService;
import org.eclipse.microprofile.graphql.*;
import io.quarkus.security.Authenticated;

import io.quarkus.security.identity.SecurityIdentity;

import java.util.List;

@GraphQLApi
@Authenticated
public class LinkGraphQLResource {

    private final LinkService linkService;
    private final SecurityIdentity identity;

    @Inject
    public LinkGraphQLResource(LinkService linkService, SecurityIdentity identity) {
        this.linkService = linkService;
        this.identity = identity;
    }

    @Query("publishedLists")
    public List<LinkList> getPublishedLists() {
        return linkService.getPublishedLists();
    }

    @Query("myLists")
    public List<LinkList> getMyLists() {
        String owner = identity.getPrincipal().getName();
        return linkService.getListsByOwner(owner);
    }

    @Query("list")
    public LinkList getList(@Name("id") String id) {
        String owner = identity.getPrincipal().getName();
        LinkList list = linkService.getList(id);
        
        // Allow public access if list is published, otherwise restrict to owner
        if (list != null && !Boolean.TRUE.equals(list.getPublished()) && !owner.equals(list.getOwner())) {
             throw new SecurityException("Not authorized to view this list");
        }
        return list;
    }

    @Mutation("createList")
    public LinkList createList(@Name("name") String name) {
        String owner = identity.getPrincipal().getName();
        return linkService.createList(owner, name);
    }

    @Mutation("updateList")
    public LinkList updateList(
        @Name("id") String id, 
        @Name("name") String name, 
        @Name("published") Boolean published, 
        @Name("linkIds") List<String> linkIds) 
    {
        String owner = identity.getPrincipal().getName();
        LinkList list = linkService.getList(id);
        if (list == null) throw new IllegalArgumentException("List not found");
        if (!owner.equals(list.getOwner())) throw new SecurityException("Not authorized to update this list");
        
        if (name != null) list.setName(name);
        if (published != null) list.setPublished(published);
        if (linkIds != null) list.setLinkIds(linkIds);
        
        linkService.updateList(list);
        return list;
    }

    @Mutation("deleteList")
    public Boolean deleteList(@Name("id") String id) {
        String owner = identity.getPrincipal().getName();
        LinkList list = linkService.getList(id);
        if (list == null) return true; // Already gone
        if (!owner.equals(list.getOwner())) throw new SecurityException("Not authorized to delete this list");
        
        linkService.deleteList(id);
        return true;
    }

    @Mutation("createLink")
    public Link createLink(@Name("url") String url, @Name("title") String title) {
        String owner = identity.getPrincipal().getName();
        return linkService.createLink(owner, url, title);
    }
    
    @Query("link")
    public Link getLink(@Name("id") String id) {
        return linkService.getLink(id);
    }
    
    @Mutation("addLinkToList")
    public LinkList addLinkToList(@Name("listId") String listId, @Name("url") String url, @Name("title") String title) {
        String owner = identity.getPrincipal().getName();
        LinkList list = linkService.getList(listId);
        if (list == null) throw new IllegalArgumentException("List not found");
        if (!owner.equals(list.getOwner())) throw new SecurityException("Not authorized to add links to this list");
        
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
        private LinkList list;
        private List<Link> links;
        
        public ListDetailsResponse() {}
        
        public ListDetailsResponse(LinkList list, List<Link> links) {
            this.list = list;
            this.links = links;
        }

        public LinkList getList() {
            return list;
        }

        public void setList(LinkList list) {
            this.list = list;
        }

        public List<Link> getLinks() {
            return links;
        }

        public void setLinks(List<Link> links) {
            this.links = links;
        }
    }
}
