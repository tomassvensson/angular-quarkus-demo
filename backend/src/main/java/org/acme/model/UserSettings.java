package org.acme.model;

/**
 * User-level settings stored in DynamoDB.
 * Holds preferences such as profile picture source, theme, locale, etc.
 */
public class UserSettings {
    private String userId;
    private String profilePictureSource; // "gravatar", "uploaded", "oidc"
    private String profilePictureS3Key;  // S3 object key if uploaded
    private String theme;                // "light", "dark", "system"
    private String locale;               // "en", "de", "se"

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProfilePictureSource() { return profilePictureSource; }
    public void setProfilePictureSource(String profilePictureSource) { this.profilePictureSource = profilePictureSource; }

    public String getProfilePictureS3Key() { return profilePictureS3Key; }
    public void setProfilePictureS3Key(String profilePictureS3Key) { this.profilePictureS3Key = profilePictureS3Key; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
}
