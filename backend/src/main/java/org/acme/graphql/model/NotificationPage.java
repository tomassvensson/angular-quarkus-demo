package org.acme.graphql.model;

import org.acme.model.Notification;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public class NotificationPage {
    private List<Notification> items;
    private int total;
    private int unreadCount;

    public NotificationPage() {}

    public NotificationPage(List<Notification> items, int total, int unreadCount) {
        this.items = items;
        this.total = total;
        this.unreadCount = unreadCount;
    }

    public List<Notification> getItems() { return items; }
    public void setItems(List<Notification> items) { this.items = items; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public int getUnreadCount() { return unreadCount; }
    public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }
}
