package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.model.UserSettings;
import org.jboss.logging.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import static software.amazon.awssdk.enhanced.dynamodb.mapper.StaticAttributeTags.primaryPartitionKey;

/**
 * Manages user settings (profile picture source, theme, locale) in DynamoDB.
 */
@ApplicationScoped
public class UserSettingsService {

    private static final Logger LOG = Logger.getLogger(UserSettingsService.class);
    private static final String DEFAULT_PROFILE_PICTURE_SOURCE = "gravatar";
    private static final String DEFAULT_THEME = "system";
    private static final String DEFAULT_LOCALE = "en";

    private final DynamoDbEnhancedClient enhancedClient;
    private DynamoDbTable<UserSettings> settingsTable;

    @Inject
    public UserSettingsService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    static final TableSchema<UserSettings> SETTINGS_SCHEMA = TableSchema.builder(UserSettings.class)
        .newItemSupplier(UserSettings::new)
        .addAttribute(String.class, a -> a.name("userId")
            .getter(UserSettings::getUserId).setter(UserSettings::setUserId).tags(primaryPartitionKey()))
        .addAttribute(String.class, a -> a.name("profilePictureSource")
            .getter(UserSettings::getProfilePictureSource).setter(UserSettings::setProfilePictureSource))
        .addAttribute(String.class, a -> a.name("profilePictureS3Key")
            .getter(UserSettings::getProfilePictureS3Key).setter(UserSettings::setProfilePictureS3Key))
        .addAttribute(String.class, a -> a.name("theme")
            .getter(UserSettings::getTheme).setter(UserSettings::setTheme))
        .addAttribute(String.class, a -> a.name("locale")
            .getter(UserSettings::getLocale).setter(UserSettings::setLocale))
        .build();

    @PostConstruct
    void init() {
        settingsTable = enhancedClient.table("UserSettings", SETTINGS_SCHEMA);
        try {
            settingsTable.createTable();
        } catch (Exception e) {
            LOG.debug("UserSettings table creation skipped (may already exist): " + e.getMessage());
        }
    }

    public UserSettings getSettings(String userId) {
        UserSettings settings = settingsTable.getItem(r -> r.key(k -> k.partitionValue(userId)));
        if (settings == null) {
            settings = createDefaultSettings(userId);
        }
        return settings;
    }

    public UserSettings updateSettings(String userId, String profilePictureSource, String theme, String locale) {
        UserSettings settings = getSettings(userId);
        if (profilePictureSource != null) {
            settings.setProfilePictureSource(profilePictureSource);
        }
        if (theme != null) {
            settings.setTheme(theme);
        }
        if (locale != null) {
            settings.setLocale(locale);
        }
        settingsTable.putItem(settings);
        return settings;
    }

    public void setProfilePictureS3Key(String userId, String s3Key) {
        UserSettings settings = getSettings(userId);
        settings.setProfilePictureS3Key(s3Key);
        settings.setProfilePictureSource("uploaded");
        settingsTable.putItem(settings);
    }

    public void clearProfilePicture(String userId) {
        UserSettings settings = getSettings(userId);
        settings.setProfilePictureS3Key(null);
        settings.setProfilePictureSource(DEFAULT_PROFILE_PICTURE_SOURCE);
        settingsTable.putItem(settings);
    }

    private UserSettings createDefaultSettings(String userId) {
        UserSettings settings = new UserSettings();
        settings.setUserId(userId);
        settings.setProfilePictureSource(DEFAULT_PROFILE_PICTURE_SOURCE);
        settings.setTheme(DEFAULT_THEME);
        settings.setLocale(DEFAULT_LOCALE);
        settingsTable.putItem(settings);
        return settings;
    }
}
