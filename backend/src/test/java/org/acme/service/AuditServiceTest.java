package org.acme.service;

import org.acme.model.AuditLog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuditService using mocked DynamoDB table.
 */
class AuditServiceTest {

    private AuditService service;
    @SuppressWarnings("unchecked")
    private final DynamoDbTable<AuditLog> mockTable = mock(DynamoDbTable.class);

    @BeforeEach
    @SuppressWarnings({"unchecked", "rawtypes"})
    void setUp() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        when(mockClient.table(any(String.class), any())).thenReturn((DynamoDbTable) mockTable);
        service = new AuditService(mockClient);

        // Set the auditTable field via reflection
        Field tableField = AuditService.class.getDeclaredField("auditTable");
        tableField.setAccessible(true);
        tableField.set(service, mockTable);
    }

    @Test
    void logCreatesAuditEntry() {
        service.log("CREATE", "LIST", "list-1", "user-1", "Created list");
        verify(mockTable).putItem(any(AuditLog.class));
    }

    @Test
    void logSetsAllFields() {
        org.mockito.ArgumentCaptor<AuditLog> captor = org.mockito.ArgumentCaptor.forClass(AuditLog.class);

        service.log("UPDATE", "LINK", "link-42", "admin", "Updated link URL");

        verify(mockTable).putItem(captor.capture());
        AuditLog entry = captor.getValue();
        assertNotNull(entry.getId());
        assertEquals("UPDATE", entry.getAction());
        assertEquals("LINK", entry.getEntityType());
        assertEquals("link-42", entry.getEntityId());
        assertEquals("admin", entry.getUserId());
        assertEquals("Updated link URL", entry.getDetails());
        assertNotNull(entry.getTimestamp());
    }

    @Test
    void logDoesNotThrowOnDynamoDbError() {
        doThrow(new RuntimeException("DynamoDB unavailable")).when(mockTable).putItem(any(AuditLog.class));
        assertDoesNotThrow(() -> service.log("DELETE", "LIST", "x", "u", "details"));
    }

    @Test
    void logNeverBreaksMainOperation() {
        doThrow(new RuntimeException("Connection refused")).when(mockTable).putItem(any(AuditLog.class));
        // Call log multiple times — none should throw
        assertDoesNotThrow(() -> {
            service.log("CREATE", "LIST", "a", "u", "d1");
            service.log("DELETE", "LINK", "b", "u", "d2");
            service.log("VOTE", "LIST", "c", "u", "d3");
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    void getRecentLogsReturnsLimitedSortedResults() {
        AuditLog older = makeLog("1", Instant.parse("2025-01-01T00:00:00Z"));
        AuditLog newer = makeLog("2", Instant.parse("2025-06-01T00:00:00Z"));
        AuditLog newest = makeLog("3", Instant.parse("2025-12-01T00:00:00Z"));

        PageIterable<AuditLog> pageIterable = mock(PageIterable.class);
        when(mockTable.scan()).thenReturn(pageIterable);
        Page<AuditLog> page = mock(Page.class);
        when(page.items()).thenReturn(List.of(older, newest, newer));
        when(pageIterable.stream()).thenReturn(Stream.of(page));
        when(pageIterable.items()).thenReturn(() -> List.of(older, newest, newer).iterator());

        List<AuditLog> result = service.getRecentLogs(2);
        assertEquals(2, result.size());
        assertEquals("3", result.get(0).getId()); // newest first
        assertEquals("2", result.get(1).getId());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getRecentLogsClampsLimit() {
        PageIterable<AuditLog> pageIterable = mock(PageIterable.class);
        when(mockTable.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(() -> List.<AuditLog>of().iterator());

        // Should not throw even with extreme limits
        assertDoesNotThrow(() -> service.getRecentLogs(0));
        assertDoesNotThrow(() -> service.getRecentLogs(999));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getLogsForEntityFiltersCorrectly() {
        AuditLog match = makeLog("1", Instant.now());
        match.setEntityType("LIST");
        match.setEntityId("list-1");

        AuditLog noMatch = makeLog("2", Instant.now());
        noMatch.setEntityType("LINK");
        noMatch.setEntityId("link-1");

        PageIterable<AuditLog> pageIterable = mock(PageIterable.class);
        when(mockTable.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(() -> List.of(match, noMatch).iterator());

        List<AuditLog> result = service.getLogsForEntity("LIST", "list-1");
        assertEquals(1, result.size());
        assertEquals("1", result.get(0).getId());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getLogsForUserFiltersCorrectly() {
        AuditLog match = makeLog("1", Instant.now());
        match.setUserId("alice");

        AuditLog noMatch = makeLog("2", Instant.now());
        noMatch.setUserId("bob");

        PageIterable<AuditLog> pageIterable = mock(PageIterable.class);
        when(mockTable.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(() -> List.of(match, noMatch).iterator());

        List<AuditLog> result = service.getLogsForUser("alice", 10);
        assertEquals(1, result.size());
        assertEquals("alice", result.get(0).getUserId());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getLogsForUserLimitsResults() {
        AuditLog a = makeLog("1", Instant.parse("2025-01-01T00:00:00Z"));
        a.setUserId("alice");
        AuditLog b = makeLog("2", Instant.parse("2025-06-01T00:00:00Z"));
        b.setUserId("alice");
        AuditLog c = makeLog("3", Instant.parse("2025-12-01T00:00:00Z"));
        c.setUserId("alice");

        PageIterable<AuditLog> pageIterable = mock(PageIterable.class);
        when(mockTable.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(() -> List.of(a, b, c).iterator());

        List<AuditLog> result = service.getLogsForUser("alice", 2);
        assertEquals(2, result.size());
        assertEquals("3", result.get(0).getId()); // newest first
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void initCreatesTable() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        DynamoDbTable<AuditLog> table = mock(DynamoDbTable.class);
        when(mockClient.table(any(String.class), any())).thenReturn((DynamoDbTable) table);

        AuditService svc = new AuditService(mockClient);
        svc.init();

        verify(table).createTable();
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void initHandlesTableAlreadyExists() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        DynamoDbTable<AuditLog> table = mock(DynamoDbTable.class);
        when(mockClient.table(any(String.class), any())).thenReturn((DynamoDbTable) table);
        doThrow(new RuntimeException("Table already exists")).when(table).createTable();

        AuditService svc = new AuditService(mockClient);
        assertDoesNotThrow(() -> svc.init());
    }

    private AuditLog makeLog(String id, Instant timestamp) {
        AuditLog log = new AuditLog();
        log.setId(id);
        log.setAction("CREATE");
        log.setEntityType("LIST");
        log.setEntityId("entity-" + id);
        log.setUserId("user-" + id);
        log.setDetails("Test detail " + id);
        log.setTimestamp(timestamp);
        return log;
    }
}
