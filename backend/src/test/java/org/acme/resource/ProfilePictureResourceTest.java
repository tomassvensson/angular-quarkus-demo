package org.acme.resource;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.core.Response;
import org.acme.model.UserSettings;
import org.acme.service.ProfilePictureService;
import org.acme.service.UserSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.Principal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ProfilePictureResource.
 * Mocks ProfilePictureService, UserSettingsService, and SecurityIdentity.
 */
class ProfilePictureResourceTest {

    private ProfilePictureResource resource;
    private ProfilePictureService mockPictureService;
    private UserSettingsService mockSettingsService;
    private SecurityIdentity mockIdentity;

    @BeforeEach
    void setUp() {
        mockPictureService = mock(ProfilePictureService.class);
        mockSettingsService = mock(UserSettingsService.class);
        mockIdentity = mock(SecurityIdentity.class);

        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("testuser");
        when(mockIdentity.getPrincipal()).thenReturn(principal);
        when(mockIdentity.getAttribute("email")).thenReturn("test@example.com");

        resource = new ProfilePictureResource(mockPictureService, mockSettingsService, mockIdentity);
    }

    // --- getUploadUrl tests ---

    @Test
    void getUploadUrl_returnsUrl() {
        when(mockPictureService.isEnabled()).thenReturn(true);
        when(mockPictureService.getUploadUrl("testuser")).thenReturn("https://s3.example.com/upload");

        Response response = resource.getUploadUrl();

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("https://s3.example.com/upload", body.get("uploadUrl"));
    }

    @Test
    void getUploadUrl_serviceUnavailable() {
        when(mockPictureService.isEnabled()).thenReturn(false);

        Response response = resource.getUploadUrl();

        assertEquals(503, response.getStatus());
    }

    // --- confirmUpload tests ---

    @Test
    void confirmUpload_setsS3Key() {
        Response response = resource.confirmUpload();

        assertEquals(200, response.getStatus());
        verify(mockSettingsService).setProfilePictureS3Key("testuser", "profile-pictures/testuser.png");
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("confirmed", body.get("status"));
    }

    // --- getProfilePictureUrl tests ---

    @Test
    void getProfilePictureUrl_returnsUrlAndMetadata() {
        UserSettings settings = new UserSettings();
        settings.setUserId("testuser");
        settings.setProfilePictureSource("uploaded");
        settings.setProfilePictureS3Key("profile-pictures/testuser.png");
        when(mockSettingsService.getSettings("testuser")).thenReturn(settings);
        when(mockPictureService.getProfilePictureUrl("testuser", "uploaded", "profile-pictures/testuser.png", "test@example.com"))
            .thenReturn("https://s3.example.com/pic");
        when(mockPictureService.isEnabled()).thenReturn(true);

        Response response = resource.getProfilePictureUrl();

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("https://s3.example.com/pic", body.get("url"));
        assertEquals("uploaded", body.get("source"));
        assertEquals(true, body.get("uploadEnabled"));
    }

    @Test
    void getProfilePictureUrl_nullSourceDefaultsToGravatar() {
        UserSettings settings = new UserSettings();
        settings.setUserId("testuser");
        settings.setProfilePictureSource(null);
        when(mockSettingsService.getSettings("testuser")).thenReturn(settings);
        when(mockPictureService.getProfilePictureUrl(any(), any(), any(), any()))
            .thenReturn("https://gravatar.com/avatar/abc");

        Response response = resource.getProfilePictureUrl();

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("gravatar", body.get("source"));
    }

    // --- getProfilePictureUrlForUser tests ---

    @Test
    void getProfilePictureUrlForUser_returnsUrl() {
        UserSettings settings = new UserSettings();
        settings.setUserId("otheruser");
        settings.setProfilePictureSource("gravatar");
        when(mockSettingsService.getSettings("otheruser")).thenReturn(settings);
        when(mockPictureService.getProfilePictureUrl("otheruser", "gravatar", null, "otheruser"))
            .thenReturn("https://gravatar.com/avatar/xyz");

        Response response = resource.getProfilePictureUrlForUser("otheruser");

        assertEquals(200, response.getStatus());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("https://gravatar.com/avatar/xyz", body.get("url"));
    }

    // --- deleteProfilePicture tests ---

    @Test
    void deleteProfilePicture_callsBothServices() {
        Response response = resource.deleteProfilePicture();

        assertEquals(200, response.getStatus());
        verify(mockPictureService).deleteProfilePicture("testuser");
        verify(mockSettingsService).clearProfilePicture("testuser");
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getEntity();
        assertEquals("deleted", body.get("status"));
    }
}
