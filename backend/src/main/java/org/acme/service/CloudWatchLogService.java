package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClientBuilder;
import software.amazon.awssdk.services.cloudwatchlogs.model.CreateLogGroupRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.CreateLogStreamRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.InputLogEvent;
import software.amazon.awssdk.services.cloudwatchlogs.model.PutLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.ResourceAlreadyExistsException;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class CloudWatchLogService {

    private static final Logger LOG = Logger.getLogger(CloudWatchLogService.class);

    @ConfigProperty(name = "aws.region", defaultValue = "eu-central-1")
    String awsRegion;

    @ConfigProperty(name = "cloudwatch.log-group", defaultValue = "/angular-quarkus-demo")
    String logGroup;

    @ConfigProperty(name = "cloudwatch.frontend-log-stream", defaultValue = "frontend")
    String frontendLogStream;

    @ConfigProperty(name = "cloudwatch.backend-log-stream", defaultValue = "backend")
    String backendLogStream;

    @ConfigProperty(name = "cloudwatch.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "cloudwatch.endpoint-override")
    Optional<String> endpointOverride;

    @ConfigProperty(name = "aws.access-key-id", defaultValue = "test")
    String awsAccessKeyId;

    @ConfigProperty(name = "aws.secret-access-key", defaultValue = "test")
    String awsSecretAccessKey;

    private CloudWatchLogsClient client;

    @PostConstruct
    void init() {
        if (!enabled) {
            LOG.info("CloudWatch logging is disabled");
            return;
        }

        CloudWatchLogsClientBuilder builder = CloudWatchLogsClient.builder()
                .region(Region.of(awsRegion));

        if (endpointOverride.isPresent() && !endpointOverride.get().isBlank()) {
            builder.endpointOverride(URI.create(endpointOverride.get().trim()));
            builder.credentialsProvider(
                    StaticCredentialsProvider.create(AwsBasicCredentials.create(awsAccessKeyId, awsSecretAccessKey)));
        }

        client = builder.build();
        ensureLogGroupAndStreams();
    }

    private void ensureLogGroupAndStreams() {
        try {
            client.createLogGroup(CreateLogGroupRequest.builder().logGroupName(logGroup).build());
        } catch (ResourceAlreadyExistsException e) {
            LOG.debug("Log group already exists: " + logGroup);
        }
        createStreamIfAbsent(frontendLogStream);
        createStreamIfAbsent(backendLogStream);
    }

    private void createStreamIfAbsent(String stream) {
        try {
            client.createLogStream(CreateLogStreamRequest.builder()
                    .logGroupName(logGroup)
                    .logStreamName(stream)
                    .build());
        } catch (ResourceAlreadyExistsException e) {
            LOG.debug("Log stream already exists: " + stream);
        }
    }

    /**
     * Send frontend log entries to CloudWatch.
     */
    public void sendFrontendLogs(List<FrontendLogEntry> entries) {
        if (!enabled || client == null || entries == null || entries.isEmpty()) {
            return;
        }

        List<InputLogEvent> events = entries.stream()
                .map(e -> InputLogEvent.builder()
                        .timestamp(e.timestamp() != null ? e.timestamp() : Instant.now().toEpochMilli())
                        .message("[" + e.level() + "] " + e.message())
                        .build())
                .toList();

        putEvents(frontendLogStream, events);
    }

    /**
     * Send a single backend log message to CloudWatch.
     */
    public void sendBackendLog(String level, String message) {
        if (!enabled || client == null) {
            return;
        }

        InputLogEvent event = InputLogEvent.builder()
                .timestamp(Instant.now().toEpochMilli())
                .message("[" + level + "] " + message)
                .build();

        putEvents(backendLogStream, List.of(event));
    }

    private void putEvents(String stream, List<InputLogEvent> events) {
        try {
            client.putLogEvents(PutLogEventsRequest.builder()
                    .logGroupName(logGroup)
                    .logStreamName(stream)
                    .logEvents(events)
                    .build());
        } catch (Exception e) {
            LOG.error("Failed to send logs to CloudWatch: " + e.getMessage(), e);
        }
    }

    public record FrontendLogEntry(String level, String message, Long timestamp) {
    }
}
