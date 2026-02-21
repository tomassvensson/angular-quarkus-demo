package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.graphql.model.CognitoUserPage;
import org.acme.graphql.model.CognitoUserView;
import org.acme.graphql.model.MfaSetupResponse;
import org.acme.graphql.model.TrustedDevice;
import org.acme.graphql.model.UpdateUserInput;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClientBuilder;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDeleteUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDisableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminEnableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminForgetDeviceRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminInitiateAuthRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminInitiateAuthResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListDevicesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListDevicesResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminRemoveUserFromGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserMfaPreferenceRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserPasswordRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminUpdateUserAttributesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AuthFlowType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.DeviceType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.NotAuthorizedException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.SMSMfaSettingsType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.SoftwareTokenMfaSettingsType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenResponse;

import java.time.Instant;
import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class CognitoAdminService {

    private static final String ATTR_EMAIL = "email";
    private static final Logger LOG = Logger.getLogger(CognitoAdminService.class);

    @ConfigProperty(name = "aws.region")
    String awsRegion;

    @ConfigProperty(name = "auth.provider", defaultValue = "cognito")
    String authProvider;

    @ConfigProperty(name = "cognito.user-pool-id")
    String userPoolId;

    @ConfigProperty(name = "aws.endpoint-override")
    Optional<String> awsEndpointOverride;

    @ConfigProperty(name = "aws.access-key-id", defaultValue = "test")
    String awsAccessKeyId;

    @ConfigProperty(name = "aws.secret-access-key", defaultValue = "test")
    String awsSecretAccessKey;

    @ConfigProperty(name = "cognito.client-id", defaultValue = "placeholder")
    String cognitoClientId;

    public CognitoUserPage listUsers(int page, int size, String sortBy, String direction) {
        int safePage = Math.max(0, page);
        int safeSize = Math.clamp(size, 1, 100);

        List<CognitoUserView> all = fetchAllUsers();
        Comparator<CognitoUserView> comparator = comparatorFor(sortBy);
        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }
        all.sort(comparator);

        int fromIndex = Math.min(safePage * safeSize, all.size());
        int toIndex = Math.min(fromIndex + safeSize, all.size());

        CognitoUserPage result = new CognitoUserPage();
        result.setItems(all.subList(fromIndex, toIndex));
        result.setPage(safePage);
        result.setSize(safeSize);
        result.setTotal(all.size());
        return result;
    }

    public CognitoUserView getUser(String username) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
             // Mock for dev
             CognitoUserView view = new CognitoUserView();
             view.setUsername(username);
             view.setEmail(username + "@example.com");
             view.setEnabled(true);
             view.setStatus("Enabled");
             if ("admin".equalsIgnoreCase(username) || "admin@example.com".equalsIgnoreCase(username)) {
                 view.setGroups(List.of("AdminUser", "RegularUser"));
             } else {
                 view.setGroups(List.of("RegularUser"));
             }
             return view;
        }
        try (CognitoIdentityProviderClient client = client()) {
            AdminGetUserResponse response = client.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
            List<String> groups = groupsForUser(client, username);
            return map(response, groups);
        }
    }

    public boolean deleteUser(String username) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
             // In mock/keycloak mode, we cannot call AWS Cognito.
             // We assume success for the demo.
             // Real implementation would call Keycloak Admin API.
             return true;
        }
        try (CognitoIdentityProviderClient client = client()) {
            client.adminDeleteUser(AdminDeleteUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
            return true;
        } catch (Exception e) {
            LOG.error("Failed to delete user: " + username, e);
            throw e;
        }
    }

    /**
     * Change a user's password. Verifies the current password via AdminInitiateAuth,
     * then sets the new password via AdminSetUserPassword.
     *
     * @param username        the Cognito username
     * @param currentPassword the user's current password
     * @param newPassword     the desired new password
     * @return true if the password was changed successfully
     */
    public boolean changePassword(String username, String currentPassword, String newPassword) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new IllegalArgumentException("Current password is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }

        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Password change requested for user " + username + " (keycloak mock - always succeeds)");
            return true;
        }

        try (CognitoIdentityProviderClient client = client()) {
            // Step 1: Verify current password via AdminInitiateAuth
            verifyCurrentPassword(client, username, currentPassword);

            // Step 2: Set new password
            client.adminSetUserPassword(AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .password(newPassword)
                    .permanent(true)
                    .build());

            LOG.info("Password changed successfully for user: " + username);
            return true;
        } catch (NotAuthorizedException e) {
            LOG.warn("Password change failed - incorrect current password for user: " + username);
            throw new SecurityException("Current password is incorrect");
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            LOG.error("Failed to change password for user: " + username, e);
            throw new RuntimeException("Failed to change password: " + e.getMessage(), e);
        }
    }

    private void verifyCurrentPassword(CognitoIdentityProviderClient client, String username, String currentPassword) {
        client.adminInitiateAuth(AdminInitiateAuthRequest.builder()
                .userPoolId(userPoolId)
                .clientId(cognitoClientId)
                .authFlow(AuthFlowType.ADMIN_USER_PASSWORD_AUTH)
                .authParameters(Map.of(
                        "USERNAME", username,
                        "PASSWORD", currentPassword
                ))
                .build());
    }

    // ---- MFA Management ----

    /**
     * List trusted (remembered) devices for a user.
     */
    public List<TrustedDevice> listTrustedDevices(String username) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Listing trusted devices for " + username + " (keycloak mock - returns empty)");
            return List.of();
        }

        try (CognitoIdentityProviderClient client = client()) {
            AdminListDevicesResponse response = client.adminListDevices(AdminListDevicesRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .limit(60)
                    .build());

            return response.devices().stream()
                    .map(this::mapDevice)
                    .toList();
        } catch (Exception e) {
            LOG.error("Failed to list devices for user: " + username, e);
            throw new RuntimeException("Failed to list trusted devices: " + e.getMessage(), e);
        }
    }

    /**
     * Remove a trusted device.
     */
    public boolean forgetDevice(String username, String deviceKey) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Forgetting device " + deviceKey + " for " + username + " (keycloak mock)");
            return true;
        }

        try (CognitoIdentityProviderClient client = client()) {
            client.adminForgetDevice(AdminForgetDeviceRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .deviceKey(deviceKey)
                    .build());
            LOG.info("Device " + deviceKey + " forgotten for user: " + username);
            return true;
        } catch (Exception e) {
            LOG.error("Failed to forget device " + deviceKey + " for user: " + username, e);
            throw new RuntimeException("Failed to remove trusted device: " + e.getMessage(), e);
        }
    }

    /**
     * Set MFA preferences for a user (enable/disable TOTP and SMS MFA).
     */
    public boolean setMfaPreference(String username, boolean totpEnabled, boolean smsEnabled, String preferredMethod) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Setting MFA preference for " + username + " (keycloak mock)");
            return true;
        }

        try (CognitoIdentityProviderClient client = client()) {
            SMSMfaSettingsType.Builder smsSettings = SMSMfaSettingsType.builder()
                    .enabled(smsEnabled)
                    .preferredMfa("SMS".equalsIgnoreCase(preferredMethod));

            SoftwareTokenMfaSettingsType.Builder totpSettings = SoftwareTokenMfaSettingsType.builder()
                    .enabled(totpEnabled)
                    .preferredMfa("TOTP".equalsIgnoreCase(preferredMethod));

            client.adminSetUserMFAPreference(AdminSetUserMfaPreferenceRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .smsMfaSettings(smsSettings.build())
                    .softwareTokenMfaSettings(totpSettings.build())
                    .build());

            LOG.info("MFA preference updated for user: " + username);
            return true;
        } catch (Exception e) {
            LOG.error("Failed to set MFA preference for user: " + username, e);
            throw new RuntimeException("Failed to set MFA preference: " + e.getMessage(), e);
        }
    }

    /**
     * Initiate TOTP MFA setup. Returns a secret code that can be used to generate a QR code.
     * The user must use an authenticator app to scan the QR code, then verify with a TOTP code.
     */
    public MfaSetupResponse setupTotp(String username) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Setting up TOTP for " + username + " (keycloak mock)");
            MfaSetupResponse response = new MfaSetupResponse();
            response.setSecretCode("MOCK_SECRET_FOR_DEV");
            response.setQrCodeUri("otpauth://totp/Demo:" + username + "?secret=MOCK_SECRET_FOR_DEV&issuer=AngularQuarkusDemo");
            return response;
        }

        try (CognitoIdentityProviderClient client = client()) {
            // Use admin auth to get a session, then associate software token
            AdminInitiateAuthResponse authResponse = client.adminInitiateAuth(AdminInitiateAuthRequest.builder()
                    .userPoolId(userPoolId)
                    .clientId(cognitoClientId)
                    .authFlow(AuthFlowType.ADMIN_USER_PASSWORD_AUTH)
                    .authParameters(Map.of("USERNAME", username))
                    .build());

            AssociateSoftwareTokenResponse tokenResponse = client.associateSoftwareToken(
                    AssociateSoftwareTokenRequest.builder()
                            .session(authResponse.session())
                            .build());

            String secret = tokenResponse.secretCode();
            String qrUri = "otpauth://totp/AngularQuarkusDemo:" + username + "?secret=" + secret + "&issuer=AngularQuarkusDemo";

            MfaSetupResponse response = new MfaSetupResponse();
            response.setSecretCode(secret);
            response.setQrCodeUri(qrUri);
            return response;
        } catch (Exception e) {
            LOG.error("Failed to setup TOTP for user: " + username, e);
            throw new RuntimeException("Failed to setup TOTP: " + e.getMessage(), e);
        }
    }

    /**
     * Verify TOTP code to complete MFA setup.
     */
    public boolean verifyTotp(String username, String totpCode) {
        if ("keycloak".equalsIgnoreCase(authProvider)) {
            LOG.info("Verifying TOTP for " + username + " (keycloak mock - always succeeds)");
            return true;
        }

        try (CognitoIdentityProviderClient client = client()) {
            // Get a session via admin auth
            AdminInitiateAuthResponse authResponse = client.adminInitiateAuth(AdminInitiateAuthRequest.builder()
                    .userPoolId(userPoolId)
                    .clientId(cognitoClientId)
                    .authFlow(AuthFlowType.ADMIN_USER_PASSWORD_AUTH)
                    .authParameters(Map.of("USERNAME", username))
                    .build());

            VerifySoftwareTokenResponse verifyResponse = client.verifySoftwareToken(
                    VerifySoftwareTokenRequest.builder()
                            .session(authResponse.session())
                            .userCode(totpCode)
                            .friendlyDeviceName("AuthenticatorApp")
                            .build());

            boolean success = "SUCCESS".equals(verifyResponse.statusAsString());

            if (success) {
                // Enable TOTP as preferred MFA after verification
                setMfaPreference(username, true, false, "TOTP");
                LOG.info("TOTP verified and enabled for user: " + username);
            }

            return success;
        } catch (Exception e) {
            LOG.error("Failed to verify TOTP for user: " + username, e);
            throw new RuntimeException("Failed to verify TOTP code: " + e.getMessage(), e);
        }
    }

    private TrustedDevice mapDevice(DeviceType device) {
        TrustedDevice td = new TrustedDevice();
        td.setDeviceKey(device.deviceKey());
        td.setCreatedDate(device.deviceCreateDate() != null ? device.deviceCreateDate().toString() : "");
        td.setLastModifiedDate(device.deviceLastModifiedDate() != null ? device.deviceLastModifiedDate().toString() : "");
        td.setLastAuthenticatedDate(device.deviceLastAuthenticatedDate() != null ? device.deviceLastAuthenticatedDate().toString() : "");

        // Extract device name from attributes
        String name = "Unknown Device";
        if (device.deviceAttributes() != null) {
            for (AttributeType attr : device.deviceAttributes()) {
                if ("device_name".equals(attr.name())) {
                    name = attr.value();
                    break;
                }
            }
        }
        td.setDeviceName(name);
        return td;
    }

    public CognitoUserView updateUser(UpdateUserInput input) {
        validateInput(input);
        String username = input.getUsername().trim();
        try (CognitoIdentityProviderClient client = client()) {
            updateEmailIfPresent(client, username, input);
            updateEnabledStatus(client, username, input.getEnabled());
            syncGroups(client, username, input.getGroups());

            AdminGetUserResponse updated = client.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
            List<String> groups = groupsForUser(client, username);
            return map(updated, groups);
        }
    }

    private void validateInput(UpdateUserInput input) {
        if (input == null || input.getUsername() == null || input.getUsername().isBlank()) {
            throw new IllegalArgumentException("username is required");
        }
    }

    private void updateEmailIfPresent(CognitoIdentityProviderClient client, String username, UpdateUserInput input) {
        if (input.getEmail() == null || input.getEmail().isBlank()) {
            return;
        }
        client.adminUpdateUserAttributes(AdminUpdateUserAttributesRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .userAttributes(
                        AttributeType.builder().name(ATTR_EMAIL).value(input.getEmail().trim()).build(),
                        AttributeType.builder().name("email_verified").value("true").build())
                .build());
    }

    private void updateEnabledStatus(CognitoIdentityProviderClient client, String username, Boolean enabled) {
        if (Boolean.TRUE.equals(enabled)) {
            client.adminEnableUser(AdminEnableUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
        } else if (Boolean.FALSE.equals(enabled)) {
            client.adminDisableUser(AdminDisableUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
        }
    }

    private void syncGroups(CognitoIdentityProviderClient client, String username, List<String> desiredGroups) {
        if (desiredGroups == null) {
            return;
        }

        Set<String> desired = new HashSet<>();
        for (String group : desiredGroups) {
            if (group != null && !group.isBlank()) {
                desired.add(group.trim());
            }
        }

        Set<String> current = new HashSet<>(groupsForUser(client, username));

        for (String group : current) {
            if (!desired.contains(group)) {
                client.adminRemoveUserFromGroup(AdminRemoveUserFromGroupRequest.builder()
                        .userPoolId(userPoolId)
                        .username(username)
                        .groupName(group)
                        .build());
            }
        }

        for (String group : desired) {
            if (!current.contains(group)) {
                client.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                        .userPoolId(userPoolId)
                        .username(username)
                        .groupName(group)
                        .build());
            }
        }
    }

    private List<CognitoUserView> fetchAllUsers() {
        List<CognitoUserView> users = new ArrayList<>();
        try (CognitoIdentityProviderClient client = client()) {
            String paginationToken = null;
            do {
                ListUsersResponse response = client.listUsers(ListUsersRequest.builder()
                        .userPoolId(userPoolId)
                        .paginationToken(paginationToken)
                        .limit(60)
                        .build());

                for (UserType user : response.users()) {
                    String username = user.username();
                    AdminGetUserResponse detail = client.adminGetUser(AdminGetUserRequest.builder()
                            .userPoolId(userPoolId)
                            .username(username)
                            .build());
                    List<String> groups = groupsForUser(client, username);
                    users.add(map(detail, groups));
                }

                paginationToken = response.paginationToken();
            } while (paginationToken != null && !paginationToken.isBlank());
        }
        return users;
    }

    private Comparator<CognitoUserView> comparatorFor(String sortBy) {
        String field = sortBy == null ? "username" : sortBy.trim().toLowerCase(Locale.ROOT);
        return switch (field) {
            case ATTR_EMAIL -> Comparator.comparing(user -> safe(user.getEmail()));
            case "status" -> Comparator.comparing(user -> safe(user.getStatus()));
            case "confirmationstatus" -> Comparator.comparing(user -> safe(user.getConfirmationStatus()));
            case "emailverified" -> Comparator.comparing(user -> user.isEmailVerified());
            case "created" -> Comparator.comparing(user -> safeInstant(user.getCreated()));
            case "lastupdatedtime" -> Comparator.comparing(user -> safeInstant(user.getLastUpdatedTime()));
            case "modified" -> Comparator.comparing(user -> safeInstant(user.getModified()));
            case "mfasetting" -> Comparator.comparing(user -> safe(user.getMfaSetting()));
            case "enabled" -> Comparator.comparing(user -> user.isEnabled());
            default -> Comparator.comparing(user -> safe(user.getUsername()));
        };
    }

    private List<String> groupsForUser(CognitoIdentityProviderClient client, String username) {
        AdminListGroupsForUserResponse groupsResponse = client.adminListGroupsForUser(
                AdminListGroupsForUserRequest.builder()
                        .userPoolId(userPoolId)
                        .username(username)
                        .build());

        List<String> groups = new ArrayList<>();
        groupsResponse.groups().forEach(groupType -> groups.add(groupType.groupName()));
        groups.sort(String::compareToIgnoreCase);
        return groups;
    }

    private CognitoUserView map(AdminGetUserResponse user, List<String> groups) {
        CognitoUserView view = new CognitoUserView();
        view.setUsername(user.username());
        view.setEmail(attributeValue(user.userAttributes(), ATTR_EMAIL));
        view.setEmailVerified(parseBoolean(attributeValue(user.userAttributes(), "email_verified")));
        view.setConfirmationStatus(user.userStatusAsString());
        view.setEnabled(Boolean.TRUE.equals(user.enabled()));
        view.setStatus(view.isEnabled() ? "Enabled" : "Disabled");
        view.setCreated(user.userCreateDate());
        view.setLastUpdatedTime(user.userLastModifiedDate());
        view.setModified(user.userLastModifiedDate());
        view.setMfaSetting(toMfaSetting(user.userMFASettingList()));
        view.setGroups(groups);
        return view;
    }

    private String attributeValue(List<AttributeType> attributes, String name) {
        for (AttributeType attribute : attributes) {
            if (name.equals(attribute.name())) {
                return attribute.value();
            }
        }
        return "";
    }

    private String safe(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private boolean parseBoolean(String value) {
        return "true".equalsIgnoreCase(value);
    }

    private String toMfaSetting(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "None";
        }
        return values.stream().sorted(String::compareToIgnoreCase).collect(Collectors.joining(", "));
    }

    private Instant safeInstant(Instant value) {
        return value == null ? Instant.EPOCH : value;
    }

    private CognitoIdentityProviderClient client() {
        CognitoIdentityProviderClientBuilder builder = CognitoIdentityProviderClient.builder()
            .region(Region.of(awsRegion));

        if (awsEndpointOverride.isPresent() && !awsEndpointOverride.get().isBlank()) {
            builder.endpointOverride(URI.create(awsEndpointOverride.get().trim()));
            builder.credentialsProvider(
                StaticCredentialsProvider.create(AwsBasicCredentials.create(awsAccessKeyId, awsSecretAccessKey)));
        }

        return builder.build();
    }
}
