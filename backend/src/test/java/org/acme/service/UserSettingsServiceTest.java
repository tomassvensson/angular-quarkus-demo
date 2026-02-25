package org.acme.service;

import org.acme.model.UserSettings;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.model.GetItemEnhancedRequest;

import java.lang.reflect.Field;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserSettingsService.
 * Mocks DynamoDbEnhancedClient / DynamoDbTable.
 */
@SuppressWarnings("unchecked")
class UserSettingsServiceTest {

    private UserSettingsService service;
    private DynamoDbTable<UserSettings> mockTable;

    @BeforeEach
    void setUp() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        mockTable = mock(DynamoDbTable.class);
        doReturn(mockTable).when(mockClient).table(any(String.class), any());

        service = new UserSettingsService(mockClient);
        // Manually set the table (since @PostConstruct init() would normally do this)
        Field tableField = UserSettingsService.class.getDeclaredField("settingsTable");
        tableField.setAccessible(true);
        tableField.set(service, mockTable);
    }

    // --- getSettings tests ---

    @Test
    void getSettings_existingUser() {
        UserSettings existing = new UserSettings();
        existing.setUserId("user1");
        existing.setTheme("dark");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        UserSettings result = service.getSettings("user1");

        assertEquals("user1", result.getUserId());
        assertEquals("dark", result.getTheme());
    }

    @Test
    void getSettings_newUserCreatesDefaults() {
        when(mockTable.getItem(any(Consumer.class))).thenReturn(null);

        UserSettings result = service.getSettings("newUser");

        assertNotNull(result);
        assertEquals("newUser", result.getUserId());
        assertEquals("gravatar", result.getProfilePictureSource());
        assertEquals("system", result.getTheme());
        assertEquals("en", result.getLocale());
        verify(mockTable).putItem(any(UserSettings.class));
    }

    // --- updateSettings tests ---

    @Test
    void updateSettings_allFieldsNonNull() {
        UserSettings existing = createDefault("user1");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        UserSettings result = service.updateSettings("user1", "uploaded", "dark", "de");

        assertEquals("uploaded", result.getProfilePictureSource());
        assertEquals("dark", result.getTheme());
        assertEquals("de", result.getLocale());
        verify(mockTable).putItem(any(UserSettings.class));
    }

    @Test
    void updateSettings_allFieldsNull_noChanges() {
        UserSettings existing = createDefault("user1");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        UserSettings result = service.updateSettings("user1", null, null, null);

        assertEquals("gravatar", result.getProfilePictureSource());
        assertEquals("system", result.getTheme());
        assertEquals("en", result.getLocale());
    }

    @Test
    void updateSettings_partialUpdate() {
        UserSettings existing = createDefault("user1");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        UserSettings result = service.updateSettings("user1", null, "dark", null);

        assertEquals("gravatar", result.getProfilePictureSource()); // unchanged
        assertEquals("dark", result.getTheme()); // changed
        assertEquals("en", result.getLocale()); // unchanged
    }

    // --- setProfilePictureS3Key tests ---

    @Test
    void setProfilePictureS3Key_setsKeyAndSource() {
        UserSettings existing = createDefault("user1");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        service.setProfilePictureS3Key("user1", "profile-pictures/user1.png");

        assertEquals("profile-pictures/user1.png", existing.getProfilePictureS3Key());
        assertEquals("uploaded", existing.getProfilePictureSource());
        verify(mockTable).putItem(existing);
    }

    // --- clearProfilePicture tests ---

    @Test
    void clearProfilePicture_resetsToGravatar() {
        UserSettings existing = createDefault("user1");
        existing.setProfilePictureS3Key("profile-pictures/user1.png");
        existing.setProfilePictureSource("uploaded");
        when(mockTable.getItem(any(Consumer.class))).thenReturn(existing);

        service.clearProfilePicture("user1");

        assertNull(existing.getProfilePictureS3Key());
        assertEquals("gravatar", existing.getProfilePictureSource());
        verify(mockTable).putItem(existing);
    }

    // --- init tests ---

    @Test
    void init_createsTable() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        DynamoDbTable<UserSettings> table = mock(DynamoDbTable.class);
        doReturn(table).when(mockClient).table(any(String.class), any());

        UserSettingsService svc = new UserSettingsService(mockClient);
        svc.init();

        verify(table).createTable();
    }

    @Test
    void init_tableAlreadyExists() throws Exception {
        DynamoDbEnhancedClient mockClient = mock(DynamoDbEnhancedClient.class);
        DynamoDbTable<UserSettings> table = mock(DynamoDbTable.class);
        doReturn(table).when(mockClient).table(any(String.class), any());
        // Simulate table already exists exception
        doThrow(new RuntimeException("Table already exists")).when(table).createTable();

        UserSettingsService svc = new UserSettingsService(mockClient);
        // Should not throw
        svc.init();
    }

    private UserSettings createDefault(String userId) {
        UserSettings settings = new UserSettings();
        settings.setUserId(userId);
        settings.setProfilePictureSource("gravatar");
        settings.setTheme("system");
        settings.setLocale("en");
        return settings;
    }
}
