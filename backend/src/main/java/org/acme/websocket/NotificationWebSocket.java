package org.acme.websocket;

import io.quarkus.websockets.next.OnClose;
import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.WebSocket;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket endpoint for real-time notifications.
 * Replaces the 30-second polling mechanism with server-push notifications.
 *
 * Clients connect to /ws/notifications after authentication.
 * The server pushes notification events as JSON messages.
 */
@WebSocket(path = "/ws/notifications")
public class NotificationWebSocket {

    private static final Logger LOG = Logger.getLogger(NotificationWebSocket.class);

    // Map of userId -> set of connections (a user may have multiple tabs/devices)
    private static final Map<String, Set<WebSocketConnection>> USER_CONNECTIONS = new ConcurrentHashMap<>();

    @Inject
    WebSocketConnection connection;

    @OnOpen
    public void onOpen() {
        String userId = getUserId();
        if (userId == null || userId.isBlank()) {
            LOG.warn("WebSocket connection without valid user identity, closing");
            connection.close();
            return;
        }

        USER_CONNECTIONS.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(connection);
        LOG.debugf("WebSocket opened for user %s (total connections: %d)", userId,
            USER_CONNECTIONS.getOrDefault(userId, Set.of()).size());
    }

    @OnClose
    public void onClose() {
        String userId = getUserId();
        if (userId != null) {
            Set<WebSocketConnection> connections = USER_CONNECTIONS.get(userId);
            if (connections != null) {
                connections.remove(connection);
                if (connections.isEmpty()) {
                    USER_CONNECTIONS.remove(userId);
                }
            }
            LOG.debugf("WebSocket closed for user %s", userId);
        }
    }

    private String getUserId() {
        // The WebSocket connection should carry the authenticated identity
        // In Quarkus WebSockets Next, the security identity is propagated from the HTTP upgrade request
        try {
            return connection.handshakeRequest().header("X-User-Id");
        } catch (Exception e) {
            LOG.debug("Could not extract user ID from WebSocket connection", e);
            return null;
        }
    }

    /**
     * Send a notification event to a specific user across all their connections.
     */
    public static void sendToUser(String userId, String jsonPayload) {
        Set<WebSocketConnection> connections = USER_CONNECTIONS.get(userId);
        if (connections == null || connections.isEmpty()) {
            return;
        }

        for (WebSocketConnection conn : connections) {
            try {
                conn.sendText(jsonPayload).subscribe().with(
                    success -> { /* sent */ },
                    failure -> LOG.warnf("Failed to send WebSocket message to user %s: %s",
                        userId, failure.getMessage())
                );
            } catch (Exception e) {
                LOG.warnf("Error sending WebSocket message: %s", e.getMessage());
            }
        }
    }

    /**
     * Get the number of connected users (for monitoring).
     */
    public static int getConnectedUserCount() {
        return USER_CONNECTIONS.size();
    }

    /**
     * Get the total number of active connections.
     */
    public static int getTotalConnectionCount() {
        return USER_CONNECTIONS.values().stream().mapToInt(Set::size).sum();
    }
}
