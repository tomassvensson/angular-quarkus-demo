package org.acme.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@ApplicationScoped
public class DynamoDBConfig {

    @Inject
    DynamoDbClient dynamoDbClient;

    @Produces
    @ApplicationScoped
    public DynamoDbEnhancedClient enhancedClient() {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }
}
