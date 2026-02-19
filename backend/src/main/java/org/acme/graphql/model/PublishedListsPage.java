package org.acme.graphql.model;

import org.acme.model.LinkList;

import java.util.List;

public class PublishedListsPage {

    private List<LinkList> items;
    private int page;
    private int size;
    private int total;

    public PublishedListsPage() {
        // default constructor for GraphQL
    }

    public PublishedListsPage(List<LinkList> items, int page, int size, int total) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.total = total;
    }

    public List<LinkList> getItems() {
        return items;
    }

    public void setItems(List<LinkList> items) {
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }
}
