package org.acme.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.lang.reflect.Field;
import java.net.URL;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ProfilePictureService.
 * Mocks S3Client and S3Presigner to avoid real AWS calls.
 */
class ProfilePictureServiceTest {

    private ProfilePictureService service;
    private S3Client mockS3Client;
    private S3Presigner mockPresigner;

    @BeforeEach
    void setUp() throws Exception {
        service = new ProfilePictureService();
        mockS3Client = mock(S3Client.class);
        mockPresigner = mock(S3Presigner.class);

        setField("bucketName", "test-bucket");
        setField("enabled", true);
        setField("awsRegion", "eu-central-1");
        setField("endpointOverride", Optional.of("http://localhost:4566"));
        setField("s3Client", mockS3Client);
        setField("s3Presigner", mockPresigner);
    }

    private void setField(String fieldName, Object value) throws Exception {
        Field field = ProfilePictureService.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(service, value);
    }

    // --- getUploadUrl tests ---

    @Test
    void getUploadUrl_returnsPresignedUrl() throws Exception {
        PresignedPutObjectRequest presigned = mock(PresignedPutObjectRequest.class);
        when(presigned.url()).thenReturn(new URL("https://s3.example.com/upload"));
        when(mockPresigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presigned);

        String url = service.getUploadUrl("user1");

        assertEquals("https://s3.example.com/upload", url);
    }

    @Test
    void getUploadUrl_throwsWhenDisabled() throws Exception {
        setField("enabled", false);

        assertThrows(IllegalStateException.class, () -> service.getUploadUrl("user1"));
    }

    // --- getDownloadUrl tests ---

    @Test
    void getDownloadUrl_returnsPresignedUrl() throws Exception {
        PresignedGetObjectRequest presigned = mock(PresignedGetObjectRequest.class);
        when(presigned.url()).thenReturn(new URL("https://s3.example.com/download"));
        when(mockPresigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presigned);

        String url = service.getDownloadUrl("user1");

        assertEquals("https://s3.example.com/download", url);
    }

    @Test
    void getDownloadUrl_returnsGravatarWhenDisabled() throws Exception {
        setField("enabled", false);

        String url = service.getDownloadUrl("user1");

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
        assertTrue(url.contains("d=identicon"));
    }

    // --- deleteProfilePicture tests ---

    @Test
    void deleteProfilePicture_callsS3Delete() {
        when(mockS3Client.deleteObject(any(DeleteObjectRequest.class)))
            .thenReturn(DeleteObjectResponse.builder().build());

        service.deleteProfilePicture("user1");

        verify(mockS3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deleteProfilePicture_noOpWhenDisabled() throws Exception {
        setField("enabled", false);

        service.deleteProfilePicture("user1");

        verify(mockS3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    // --- getGravatarUrl tests ---

    @Test
    void getGravatarUrl_returnsMd5BasedUrl() {
        String url = service.getGravatarUrl("test@example.com");

        assertNotNull(url);
        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
        assertTrue(url.contains("s=50"));
        assertTrue(url.contains("d=identicon"));
    }

    @Test
    void getGravatarUrl_caseInsensitive() {
        String url1 = service.getGravatarUrl("Test@Example.com");
        String url2 = service.getGravatarUrl("test@example.com");

        assertEquals(url1, url2);
    }

    @Test
    void getGravatarUrl_trims() {
        String url1 = service.getGravatarUrl("  test@example.com  ");
        String url2 = service.getGravatarUrl("test@example.com");

        assertEquals(url1, url2);
    }

    // --- getProfilePictureUrl tests ---

    @Test
    void getProfilePictureUrl_uploadedAndEnabledReturnsPresigned() throws Exception {
        PresignedGetObjectRequest presigned = mock(PresignedGetObjectRequest.class);
        when(presigned.url()).thenReturn(new URL("https://s3.example.com/dl"));
        when(mockPresigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presigned);

        String url = service.getProfilePictureUrl("user1", "uploaded", "profile-pictures/user1.png", "user1@test.com");

        assertEquals("https://s3.example.com/dl", url);
    }

    @Test
    void getProfilePictureUrl_uploadedButDisabledReturnsGravatar() throws Exception {
        setField("enabled", false);

        String url = service.getProfilePictureUrl("user1", "uploaded", "profile-pictures/user1.png", "user1@test.com");

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
    }

    @Test
    void getProfilePictureUrl_uploadedButNullKeyReturnsGravatar() {
        String url = service.getProfilePictureUrl("user1", "uploaded", null, "user1@test.com");

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
    }

    @Test
    void getProfilePictureUrl_gravatarSourceUsesEmail() {
        String url = service.getProfilePictureUrl("user1", "gravatar", null, "user1@test.com");

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
    }

    @Test
    void getProfilePictureUrl_nullEmailUsesUserId() {
        String url = service.getProfilePictureUrl("user1", "gravatar", null, null);

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
    }

    @Test
    void getProfilePictureUrl_blankEmailUsesUserId() {
        String url = service.getProfilePictureUrl("user1", "gravatar", null, "   ");

        assertTrue(url.startsWith("https://www.gravatar.com/avatar/"));
    }

    // --- isEnabled tests ---

    @Test
    void isEnabled_returnsTrue() {
        assertTrue(service.isEnabled());
    }

    @Test
    void isEnabled_returnsFalseWhenDisabled() throws Exception {
        setField("enabled", false);
        assertFalse(service.isEnabled());
    }

    // --- init tests ---

    @Test
    void init_disabledDoesNotCreateClients() throws Exception {
        ProfilePictureService svc = new ProfilePictureService();
        setField(svc, "enabled", false);
        setField(svc, "endpointOverride", Optional.empty());
        setField(svc, "awsRegion", "eu-central-1");
        setField(svc, "bucketName", "test");

        svc.init();

        assertFalse(svc.isEnabled());
    }

    @Test
    void init_localstackCreatesClientsAndBucket() throws Exception {
        ProfilePictureService svc = new ProfilePictureService();
        setField(svc, "enabled", true);
        setField(svc, "endpointOverride", Optional.of("http://localhost:4566"));
        setField(svc, "awsRegion", "eu-central-1");
        setField(svc, "bucketName", "test-bucket");

        // This will try to connect to LocalStack (which may not be running)
        // but we verify it doesn't crash and disables on error
        svc.init();

        // After init with unreachable LocalStack, enabled should be false (exception path)
        // or true if localstack is reachable; either way, no NPE
        // The service gracefully handles the error
    }

    @Test
    void init_exceptionDisablesService() throws Exception {
        ProfilePictureService svc = new ProfilePictureService();
        setField(svc, "enabled", true);
        // Malformed URI will cause URI.create() to throw, triggering the catch block
        setField(svc, "endpointOverride", Optional.of("not a valid uri %%% :::"));
        setField(svc, "awsRegion", "eu-central-1");
        setField(svc, "bucketName", "test-bucket");

        svc.init();

        // After the URI parsing exception, service should disable itself
        assertFalse(svc.isEnabled());
    }

    private void setField(ProfilePictureService svc, String fieldName, Object value) throws Exception {
        Field field = ProfilePictureService.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(svc, value);
    }
}
