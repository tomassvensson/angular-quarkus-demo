package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.Link;
import org.acme.model.LinkList;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ReadBatch;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;
import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.secondaryPartitionKey;
import java.time.Instant;

@ApplicationScoped
public class LinkService {

    private static final Logger LOG = Logger.getLogger(LinkService.class);
    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<Link> linkTable;
    private DynamoDbTable<LinkList> listTable;
    private DynamoDbIndex<LinkList> ownerIndex;

    @Inject
    public LinkService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    private static final TableSchema<LinkList> LIST_SCHEMA = TableSchema.builder(LinkList.class)
        .newItemSupplier(LinkList::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(LinkList::getId)
            .setter(LinkList::setId)
            .tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("owner")
            .getter(LinkList::getOwner)
            .setter(LinkList::setOwner)
            .tags(secondaryPartitionKey("OwnerIndex")))
        .addAttribute(String.class, a -> a.name("name")
            .getter(LinkList::getName)
            .setter(LinkList::setName))
        .addAttribute(Boolean.class, a -> a.name("published")
            .getter(LinkList::getPublished)
            .setter(LinkList::setPublished))
        .addAttribute(EnhancedType.listOf(String.class), a -> a.name("linkIds")
            .getter(LinkList::getLinkIds)
            .setter(LinkList::setLinkIds))
        .addAttribute(Instant.class, a -> a.name("createdAt")
            .getter(LinkList::getCreatedAt)
            .setter(LinkList::setCreatedAt))
        .addAttribute(Instant.class, a -> a.name("updatedAt")
            .getter(LinkList::getUpdatedAt)
            .setter(LinkList::setUpdatedAt))
        .build();

    private static final TableSchema<Link> LINK_SCHEMA = TableSchema.builder(Link.class)
        .newItemSupplier(Link::new)
        .addAttribute(String.class, a -> a.name("id")
            .getter(Link::getId)
            .setter(Link::setId)
            .tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("owner")
            .getter(Link::getOwner)
            .setter(Link::setOwner))
        .addAttribute(String.class, a -> a.name("url")
            .getter(Link::getUrl)
            .setter(Link::setUrl))
        .addAttribute(String.class, a -> a.name("title")
            .getter(Link::getTitle)
            .setter(Link::setTitle))
        .addAttribute(Instant.class, a -> a.name("createdAt")
            .getter(Link::getCreatedAt)
            .setter(Link::setCreatedAt))
        .addAttribute(Instant.class, a -> a.name("updatedAt")
            .getter(Link::getUpdatedAt)
            .setter(Link::setUpdatedAt))
        .build();

    @PostConstruct
    void init() {
        linkTable = enhancedClient.table("Links", LINK_SCHEMA);
        listTable = enhancedClient.table("Lists", LIST_SCHEMA);
        ownerIndex = listTable.index("OwnerIndex");

        // Create tables if not exist (mostly for local development)
        try {
            linkTable.createTable();
            listTable.createTable();
        } catch (Exception e) {
            LOG.debug("Table creation skipped (may already exist): " + e.getMessage());
        }
    }

    public List<LinkList> getListsByOwner(String owner) {
        // Use OwnerIndex GSI to query by owner instead of scanning the entire table
        return ownerIndex.query(QueryConditional.keyEqualTo(
                Key.builder().partitionValue(owner).build()))
            .stream()
            .flatMap(page -> page.items().stream())
            .toList();
    }
    
    public List<LinkList> getPublishedLists() {
        // No GSI for published flag — scan is acceptable since published lists are a small subset
        // and this is called infrequently (homepage). A GSI with sparse index could optimize later.
        return listTable.scan().items().stream()
                .filter(l -> Boolean.TRUE.equals(l.getPublished()))
                .toList();
    }

    public LinkList getList(String id) {
        return listTable.getItem(r -> r.key(k -> k.partitionValue(id)));
    }

    public LinkList createList(String owner, String name) {
        LinkList list = new LinkList();
        list.setId(UUID.randomUUID().toString());
        list.setOwner(owner);
        list.setName(name);
        list.setPublished(false);
        Instant now = Instant.now();
        list.setCreatedAt(now);
        list.setUpdatedAt(now);
        listTable.putItem(list);
        return list;
    }

    public void updateList(LinkList list) {
        list.setUpdatedAt(Instant.now());
        listTable.updateItem(list);
    }

    public void deleteList(String id) {
        listTable.deleteItem(r -> r.key(k -> k.partitionValue(id)));
    }

    public Link createLink(String owner, String url, String title) {
        Link link = new Link();
        link.setId(UUID.randomUUID().toString());
        link.setOwner(owner);
        link.setUrl(url);
        link.setTitle(title);
        Instant now = Instant.now();
        link.setCreatedAt(now);
        link.setUpdatedAt(now);
        linkTable.putItem(link);
        return link;
    }
    
    public Link getLink(String id) {
        return linkTable.getItem(r -> r.key(k -> k.partitionValue(id)));
    }

    public List<Link> getLinksByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        // Use BatchGetItem for efficient multi-key retrieval (max 100 per batch)
        ReadBatch.Builder<Link> batchBuilder = ReadBatch.builder(Link.class)
            .mappedTableResource(linkTable);
        for (String id : ids) {
            batchBuilder.addGetItem(Key.builder().partitionValue(id).build());
        }
        return enhancedClient.batchGetItem(r -> r.addReadBatch(batchBuilder.build()))
            .resultsForTable(linkTable)
            .stream()
            .filter(Objects::nonNull)
            .toList();
    }
}
