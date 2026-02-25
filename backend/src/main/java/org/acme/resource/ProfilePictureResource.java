package org.acme.resource;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.model.UserSettings;
import org.acme.service.ProfilePictureService;
import org.acme.service.UserSettingsService;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * REST endpoints for profile picture management.
 * Provides presigned URLs for S3 upload/download and manages picture source preferences.
 */
@Path("/api/v1/profile-picture")
@Authenticated
public class ProfilePictureResource {

    private static final Logger LOG = Logger.getLogger(ProfilePictureResource.class);

    private final ProfilePictureService profilePictureService;
    private final UserSettingsService userSettingsService;
    private final SecurityIdentity identity;

    @Inject
    public ProfilePictureResource(ProfilePictureService profilePictureService,
                                   UserSettingsService userSettingsService,
                                   SecurityIdentity identity) {
        this.profilePictureService = profilePictureService;
        this.userSettingsService = userSettingsService;
        this.identity = identity;
    }

    /**
     * Get a presigned URL for uploading a profile picture.
     */
    @GET
    @Path("/upload-url")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUploadUrl() {
        if (!profilePictureService.isEnabled()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of("error", "Profile picture uploads are not enabled"))
                .build();
        }

        String userId = identity.getPrincipal().getName();
        String uploadUrl = profilePictureService.getUploadUrl(userId);
        return Response.ok(Map.of("uploadUrl", uploadUrl)).build();
    }

    /**
     * Confirm upload completion — marks the user's profile picture source as "uploaded".
     */
    @POST
    @Path("/confirm-upload")
    @Produces(MediaType.APPLICATION_JSON)
    public Response confirmUpload() {
        String userId = identity.getPrincipal().getName();
        String s3Key = "profile-pictures/" + userId + ".png";
        userSettingsService.setProfilePictureS3Key(userId, s3Key);
        LOG.info("User " + userId + " confirmed profile picture upload");
        return Response.ok(Map.of("status", "confirmed")).build();
    }

    /**
     * Get the current user's profile picture URL (resolved based on their settings).
     */
    @GET
    @Path("/url")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfilePictureUrl() {
        String userId = identity.getPrincipal().getName();
        String email = identity.getAttribute("email");
        UserSettings settings = userSettingsService.getSettings(userId);

        String url = profilePictureService.getProfilePictureUrl(
            userId,
            settings.getProfilePictureSource(),
            settings.getProfilePictureS3Key(),
            email
        );

        return Response.ok(Map.of(
            "url", url,
            "source", settings.getProfilePictureSource() != null ? settings.getProfilePictureSource() : "gravatar",
            "uploadEnabled", profilePictureService.isEnabled()
        )).build();
    }

    /**
     * Get profile picture URL for a specific user (for displaying next to comments, etc.).
     */
    @GET
    @Path("/url/{username}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfilePictureUrlForUser(@PathParam("username") String username) {
        UserSettings settings = userSettingsService.getSettings(username);
        String url = profilePictureService.getProfilePictureUrl(
            username,
            settings.getProfilePictureSource(),
            settings.getProfilePictureS3Key(),
            username  // Use username as email fallback for Gravatar
        );

        return Response.ok(Map.of("url", url)).build();
    }

    /**
     * Delete the uploaded profile picture and revert to gravatar.
     */
    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteProfilePicture() {
        String userId = identity.getPrincipal().getName();
        profilePictureService.deleteProfilePicture(userId);
        userSettingsService.clearProfilePicture(userId);
        LOG.info("User " + userId + " deleted their profile picture");
        return Response.ok(Map.of("status", "deleted")).build();
    }
}
