package org.acme.resource;

import org.acme.service.CloudWatchLogService;
import org.acme.service.CloudWatchLogService.FrontendLogEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for LogIngestionResource.
 */
class LogIngestionResourceTest {

    private LogIngestionResource resource;
    private CloudWatchLogService mockService;

    @BeforeEach
    void setUp() {
        mockService = mock(CloudWatchLogService.class);
        resource = new LogIngestionResource(mockService);
    }

    @Test
    void testIngestLogsSuccess() {
        List<FrontendLogEntry> entries = List.of(
                new FrontendLogEntry("INFO", "Test log", System.currentTimeMillis()));

        Response response = resource.ingestLogs(entries);

        assertEquals(Response.Status.ACCEPTED.getStatusCode(), response.getStatus());
        verify(mockService).sendFrontendLogs(entries);
    }

    @Test
    void testIngestLogsNull() {
        Response response = resource.ingestLogs(null);

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        verify(mockService, never()).sendFrontendLogs(anyList());
    }

    @Test
    void testIngestLogsEmptyList() {
        Response response = resource.ingestLogs(List.of());

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        verify(mockService, never()).sendFrontendLogs(anyList());
    }

    @Test
    void testIngestLogsTooManyEntries() {
        List<FrontendLogEntry> entries = new ArrayList<>();
        IntStream.range(0, 101).forEach(i ->
                entries.add(new FrontendLogEntry("INFO", "Entry " + i, System.currentTimeMillis())));

        Response response = resource.ingestLogs(entries);

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        verify(mockService, never()).sendFrontendLogs(anyList());
    }

    @Test
    void testIngestLogsExactly100Entries() {
        List<FrontendLogEntry> entries = new ArrayList<>();
        IntStream.range(0, 100).forEach(i ->
                entries.add(new FrontendLogEntry("INFO", "Entry " + i, System.currentTimeMillis())));

        Response response = resource.ingestLogs(entries);

        assertEquals(Response.Status.ACCEPTED.getStatusCode(), response.getStatus());
        verify(mockService).sendFrontendLogs(entries);
    }

    @Test
    void testIngestLogsServiceThrowsException() {
        List<FrontendLogEntry> entries = List.of(
                new FrontendLogEntry("INFO", "Test", System.currentTimeMillis()));

        doThrow(new RuntimeException("CloudWatch down")).when(mockService).sendFrontendLogs(entries);

        Response response = resource.ingestLogs(entries);

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
    }
}
