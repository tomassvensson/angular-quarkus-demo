package org.acme.websocket;

import io.quarkus.websockets.next.HandshakeRequest;
import io.quarkus.websockets.next.WebSocketConnection;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for NotificationWebSocket.
 * Tests connection lifecycle and message sending logic.
 */
class NotificationWebSocketTest {

    private NotificationWebSocket ws;
    private WebSocketConnection mockConnection;
    private HandshakeRequest mockHandshake;

    @BeforeEach
    void setUp() throws Exception {
        clearConnectionsMap();

        ws = new NotificationWebSocket();
        mockConnection = mock(WebSocketConnection.class);
        mockHandshake = mock(HandshakeRequest.class);

        when(mockConnection.handshakeRequest()).thenReturn(mockHandshake);

        Field connectionField = NotificationWebSocket.class.getDeclaredField("connection");
        connectionField.setAccessible(true);
        connectionField.set(ws, mockConnection);
    }

    @AfterEach
    void tearDown() throws Exception {
        clearConnectionsMap();
    }

    @SuppressWarnings("unchecked")
    private void clearConnectionsMap() throws Exception {
        Field mapField = NotificationWebSocket.class.getDeclaredField("USER_CONNECTIONS");
        mapField.setAccessible(true);
        ((Map<String, Set<WebSocketConnection>>) mapField.get(null)).clear();
    }

    private NotificationWebSocket createWsInstance(String userId) throws Exception {
        NotificationWebSocket instance = new NotificationWebSocket();
        WebSocketConnection conn = mock(WebSocketConnection.class);
        HandshakeRequest hs = mock(HandshakeRequest.class);
        when(conn.handshakeRequest()).thenReturn(hs);
        when(hs.header("X-User-Id")).thenReturn(userId);
        Field connField = NotificationWebSocket.class.getDeclaredField("connection");
        connField.setAccessible(true);
        connField.set(instance, conn);
        return instance;
    }

    // --- onOpen tests ---

    @Test
    void onOpen_validUser_addsConnection() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");

        ws.onOpen();

        assertEquals(1, NotificationWebSocket.getConnectedUserCount());
        assertEquals(1, NotificationWebSocket.getTotalConnectionCount());
    }

    @Test
    void onOpen_nullUserId_closesConnection() {
        when(mockHandshake.header("X-User-Id")).thenReturn(null);

        ws.onOpen();

        verify(mockConnection).close();
        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void onOpen_blankUserId_closesConnection() {
        when(mockHandshake.header("X-User-Id")).thenReturn("   ");

        ws.onOpen();

        verify(mockConnection).close();
        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void onOpen_multipleConnectionsSameUser() throws Exception {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        NotificationWebSocket ws2 = createWsInstance("user1");
        ws2.onOpen();

        assertEquals(1, NotificationWebSocket.getConnectedUserCount());
        assertEquals(2, NotificationWebSocket.getTotalConnectionCount());
    }

    // --- onClose tests ---

    @Test
    void onClose_removesConnection() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();
        assertEquals(1, NotificationWebSocket.getTotalConnectionCount());

        ws.onClose();
        assertEquals(0, NotificationWebSocket.getTotalConnectionCount());
        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void onClose_nullUserId_noOp() {
        when(mockHandshake.header("X-User-Id")).thenReturn(null);

        ws.onClose();

        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void onClose_lastConnectionRemovesUserEntry() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        ws.onClose();

        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void onClose_multipleConnections_removesSingleConnection() throws Exception {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        NotificationWebSocket ws2 = createWsInstance("user1");
        ws2.onOpen();
        assertEquals(2, NotificationWebSocket.getTotalConnectionCount());

        ws.onClose();
        assertEquals(1, NotificationWebSocket.getTotalConnectionCount());
        assertEquals(1, NotificationWebSocket.getConnectedUserCount());
    }

    // --- getUserId exception test ---

    @Test
    void getUserId_exceptionReturnsNull_closesConnection() {
        when(mockConnection.handshakeRequest()).thenThrow(new RuntimeException("Test error"));

        ws.onOpen();

        verify(mockConnection).close();
    }

    // --- sendToUser tests ---

    @Test
    void sendToUser_noConnections_doesNothing() {
        // Should not throw
        NotificationWebSocket.sendToUser("nonexistent", "{\"test\":true}");
    }

    @Test
    void sendToUser_withConnection_sendsText() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        when(mockConnection.sendText(any(String.class)))
            .thenReturn(Uni.createFrom().voidItem());

        NotificationWebSocket.sendToUser("user1", "{\"type\":\"NEW_NOTIFICATION\"}");

        verify(mockConnection).sendText("{\"type\":\"NEW_NOTIFICATION\"}");
    }

    @Test
    void sendToUser_connectionSendFails_handledGracefully() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        when(mockConnection.sendText(any(String.class)))
            .thenReturn(Uni.createFrom().failure(new RuntimeException("Send failed")));

        // Should not throw even on failure
        NotificationWebSocket.sendToUser("user1", "{\"type\":\"NEW_NOTIFICATION\"}");

        verify(mockConnection).sendText("{\"type\":\"NEW_NOTIFICATION\"}");
    }

    @Test
    void sendToUser_connectionThrowsException_handledGracefully() {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        when(mockConnection.sendText(any(String.class)))
            .thenThrow(new RuntimeException("Connection broken"));

        // Should not throw
        NotificationWebSocket.sendToUser("user1", "{\"type\":\"NEW_NOTIFICATION\"}");
    }

    @Test
    void sendToUser_nullConnections_doesNothing() {
        // User that was never connected
        NotificationWebSocket.sendToUser("ghost", "{}");
        // passes if no exception thrown
    }

    // --- static counter tests ---

    @Test
    void getConnectedUserCount_empty() {
        assertEquals(0, NotificationWebSocket.getConnectedUserCount());
    }

    @Test
    void getTotalConnectionCount_empty() {
        assertEquals(0, NotificationWebSocket.getTotalConnectionCount());
    }

    @Test
    void counters_multipleUsers() throws Exception {
        when(mockHandshake.header("X-User-Id")).thenReturn("user1");
        ws.onOpen();

        NotificationWebSocket ws2 = createWsInstance("user2");
        ws2.onOpen();

        assertEquals(2, NotificationWebSocket.getConnectedUserCount());
        assertEquals(2, NotificationWebSocket.getTotalConnectionCount());
    }
}
