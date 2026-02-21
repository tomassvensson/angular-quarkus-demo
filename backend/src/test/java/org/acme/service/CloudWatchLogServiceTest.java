package org.acme.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.CreateLogGroupRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.CreateLogStreamRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.PutLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.PutLogEventsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.ResourceAlreadyExistsException;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CloudWatchLogService using mocked CloudWatchLogsClient.
 */
class CloudWatchLogServiceTest {

    private CloudWatchLogService service;
    private CloudWatchLogsClient mockClient;

    @BeforeEach
    void setUp() throws Exception {
        service = new CloudWatchLogService();
        mockClient = mock(CloudWatchLogsClient.class);

        setField("awsRegion", "eu-central-1");
        setField("logGroup", "/test-log-group");
        setField("frontendLogStream", "frontend");
        setField("backendLogStream", "backend");
        setField("enabled", true);
        setField("endpointOverride", Optional.empty());
        setField("awsAccessKeyId", "test");
        setField("awsSecretAccessKey", "test");
        setField("client", mockClient);
    }

    private void setField(String name, Object value) throws Exception {
        Field field = CloudWatchLogService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(service, value);
    }

    // ---- sendFrontendLogs ----

    @Test
    void testSendFrontendLogsSuccess() {
        when(mockClient.putLogEvents(any(PutLogEventsRequest.class)))
                .thenReturn(PutLogEventsResponse.builder().build());

        List<CloudWatchLogService.FrontendLogEntry> entries = List.of(
                new CloudWatchLogService.FrontendLogEntry("INFO", "Test message", System.currentTimeMillis()),
                new CloudWatchLogService.FrontendLogEntry("ERROR", "Error message", null)
        );

        assertDoesNotThrow(() -> service.sendFrontendLogs(entries));
        verify(mockClient).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendFrontendLogsDisabled() throws Exception {
        setField("enabled", false);

        List<CloudWatchLogService.FrontendLogEntry> entries = List.of(
                new CloudWatchLogService.FrontendLogEntry("INFO", "Should not send", System.currentTimeMillis())
        );

        service.sendFrontendLogs(entries);
        verify(mockClient, never()).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendFrontendLogsNullList() {
        service.sendFrontendLogs(null);
        verify(mockClient, never()).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendFrontendLogsEmptyList() {
        service.sendFrontendLogs(List.of());
        verify(mockClient, never()).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendFrontendLogsNullClient() throws Exception {
        setField("client", null);

        List<CloudWatchLogService.FrontendLogEntry> entries = List.of(
                new CloudWatchLogService.FrontendLogEntry("INFO", "Test", System.currentTimeMillis())
        );

        assertDoesNotThrow(() -> service.sendFrontendLogs(entries));
    }

    @Test
    void testSendFrontendLogsPutEventsException() {
        when(mockClient.putLogEvents(any(PutLogEventsRequest.class)))
                .thenThrow(new RuntimeException("CloudWatch error"));

        List<CloudWatchLogService.FrontendLogEntry> entries = List.of(
                new CloudWatchLogService.FrontendLogEntry("INFO", "Test", System.currentTimeMillis())
        );

        // Should not throw — the error is caught and logged
        assertDoesNotThrow(() -> service.sendFrontendLogs(entries));
    }

    // ---- sendBackendLog ----

    @Test
    void testSendBackendLogSuccess() {
        when(mockClient.putLogEvents(any(PutLogEventsRequest.class)))
                .thenReturn(PutLogEventsResponse.builder().build());

        assertDoesNotThrow(() -> service.sendBackendLog("INFO", "Backend log message"));
        verify(mockClient).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendBackendLogDisabled() throws Exception {
        setField("enabled", false);

        service.sendBackendLog("INFO", "Should not send");
        verify(mockClient, never()).putLogEvents(any(PutLogEventsRequest.class));
    }

    @Test
    void testSendBackendLogNullClient() throws Exception {
        setField("client", null);

        assertDoesNotThrow(() -> service.sendBackendLog("INFO", "Test"));
    }

    @Test
    void testSendBackendLogException() {
        when(mockClient.putLogEvents(any(PutLogEventsRequest.class)))
                .thenThrow(new RuntimeException("Network error"));

        // Should not throw — the error is caught and logged
        assertDoesNotThrow(() -> service.sendBackendLog("ERROR", "Test"));
    }

    // ---- init / ensureLogGroupAndStreams ----

    @Test
    void testInitWhenDisabled() throws Exception {
        setField("enabled", false);
        setField("client", null);

        // Call init via reflection
        Method initMethod = CloudWatchLogService.class.getDeclaredMethod("init");
        initMethod.setAccessible(true);

        assertDoesNotThrow(() -> initMethod.invoke(service));
        // client should remain null since init exits early
    }

    @Test
    void testEnsureLogGroupAndStreamsAlreadyExist() throws Exception {
        // createLogGroup throws ResourceAlreadyExistsException
        when(mockClient.createLogGroup(any(CreateLogGroupRequest.class)))
                .thenThrow(ResourceAlreadyExistsException.builder().message("exists").build());
        when(mockClient.createLogStream(any(CreateLogStreamRequest.class)))
                .thenThrow(ResourceAlreadyExistsException.builder().message("exists").build());

        Method method = CloudWatchLogService.class.getDeclaredMethod("ensureLogGroupAndStreams");
        method.setAccessible(true);

        assertDoesNotThrow(() -> method.invoke(service));
    }

    // ---- FrontendLogEntry record ----

    @Test
    void testFrontendLogEntryRecord() {
        CloudWatchLogService.FrontendLogEntry entry =
                new CloudWatchLogService.FrontendLogEntry("WARN", "A warning", 1234567890L);

        org.junit.jupiter.api.Assertions.assertEquals("WARN", entry.level());
        org.junit.jupiter.api.Assertions.assertEquals("A warning", entry.message());
        org.junit.jupiter.api.Assertions.assertEquals(1234567890L, entry.timestamp());
    }
}
