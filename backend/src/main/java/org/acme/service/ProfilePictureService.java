package org.acme.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Optional;

/**
 * Manages profile picture uploads/downloads via S3 with presigned URLs.
 * Falls back to Gravatar URLs when no custom picture is uploaded.
 */
@ApplicationScoped
public class ProfilePictureService {

    private static final Logger LOG = Logger.getLogger(ProfilePictureService.class);
    private static final String PROFILE_PICTURES_PREFIX = "profile-pictures/";
    private static final Duration PRESIGN_DURATION = Duration.ofMinutes(15);
    private static final int GRAVATAR_SIZE = 50;

    @ConfigProperty(name = "profile-pictures.bucket", defaultValue = "toms-profile-pictures")
    String bucketName;

    @ConfigProperty(name = "profile-pictures.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "profile-pictures.endpoint-override", defaultValue = "")
    Optional<String> endpointOverride;

    @ConfigProperty(name = "aws.region", defaultValue = "eu-central-1")
    String awsRegion;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    @PostConstruct
    void init() {
        if (!enabled) {
            LOG.info("Profile pictures S3 integration is disabled");
            return;
        }

        try {
            Region region = Region.of(awsRegion);

            if (endpointOverride.isPresent() && !endpointOverride.get().isBlank()) {
                // LocalStack / dev mode
                URI endpoint = URI.create(endpointOverride.get());
                StaticCredentialsProvider creds = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create("test", "test"));

                s3Client = S3Client.builder()
                    .region(region)
                    .endpointOverride(endpoint)
                    .credentialsProvider(creds)
                    .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                    .build();

                s3Presigner = S3Presigner.builder()
                    .region(region)
                    .endpointOverride(endpoint)
                    .credentialsProvider(creds)
                    .build();

                // Create bucket in LocalStack if it doesn't exist
                createBucketIfNeeded();
            } else {
                // Production: use default AWS credentials
                s3Client = S3Client.builder()
                    .region(region)
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();

                s3Presigner = S3Presigner.builder()
                    .region(region)
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            }

            LOG.info("Profile pictures S3 integration initialized for bucket: " + bucketName);
        } catch (Exception e) {
            LOG.error("Failed to initialize S3 for profile pictures", e);
            enabled = false;
        }
    }

    /**
     * Generates a presigned PUT URL for uploading a profile picture.
     */
    public String getUploadUrl(String userId) {
        if (!enabled) {
            throw new IllegalStateException("Profile pictures are not enabled");
        }

        String key = getS3Key(userId);
        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .contentType("image/png")
            .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(PRESIGN_DURATION)
            .putObjectRequest(putRequest)
            .build();

        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }

    /**
     * Generates a presigned GET URL for downloading a profile picture.
     */
    public String getDownloadUrl(String userId) {
        if (!enabled) {
            return getGravatarUrl(userId);
        }

        String key = getS3Key(userId);
        GetObjectRequest getRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(PRESIGN_DURATION)
            .getObjectRequest(getRequest)
            .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    /**
     * Deletes a user's uploaded profile picture from S3.
     */
    public void deleteProfilePicture(String userId) {
        if (!enabled) {
            return;
        }

        String key = getS3Key(userId);
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build());
        LOG.info("Deleted profile picture for user: " + userId);
    }

    /**
     * Returns a Gravatar URL for the given email/username.
     * Uses MD5 hash of the lowercase, trimmed identifier.
     */
    public String getGravatarUrl(String emailOrUsername) {
        String hash = md5Hex(emailOrUsername.trim().toLowerCase());
        return "https://www.gravatar.com/avatar/" + hash + "?s=" + GRAVATAR_SIZE + "&d=identicon";
    }

    /**
     * Returns the appropriate profile picture URL based on user settings.
     */
    public String getProfilePictureUrl(String userId, String profilePictureSource, String s3Key, String email) {
        if ("uploaded".equals(profilePictureSource) && s3Key != null && enabled) {
            return getDownloadUrl(userId);
        }
        // Default to gravatar
        String identifier = (email != null && !email.isBlank()) ? email : userId;
        return getGravatarUrl(identifier);
    }

    public boolean isEnabled() {
        return enabled;
    }

    private String getS3Key(String userId) {
        return PROFILE_PICTURES_PREFIX + userId + ".png";
    }

    private void createBucketIfNeeded() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (Exception e) {
            try {
                s3Client.createBucket(b -> b.bucket(bucketName));
                LOG.info("Created S3 bucket for profile pictures: " + bucketName);
            } catch (Exception createEx) {
                LOG.warn("Could not create S3 bucket: " + createEx.getMessage());
            }
        }
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5"); // NOSONAR - MD5 used for Gravatar URL hash, not for security
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(32);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            // MD5 must always be available
            throw new IllegalStateException("MD5 not available", e);
        }
    }
}
