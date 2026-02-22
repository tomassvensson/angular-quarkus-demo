package org.acme.graphql.model;

import java.util.List;

public class CognitoUserPage {
    private List<CognitoUserView> items;
    private int page;
    private int size;
    private long total;
    /** Cursor for next page, null if no more pages. */
    private String cursor;

    public List<CognitoUserView> getItems() {
        return items;
    }

    public void setItems(List<CognitoUserView> items) {
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

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public String getCursor() {
        return cursor;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }
}
