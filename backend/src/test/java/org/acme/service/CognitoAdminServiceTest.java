package org.acme.service;

import org.acme.graphql.model.MfaSetupResponse;
import org.acme.graphql.model.TrustedDevice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDeleteUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDeleteUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminForgetDeviceRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminForgetDeviceResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminInitiateAuthRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminInitiateAuthResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListDevicesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListDevicesResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserMfaPreferenceRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserMfaPreferenceResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserPasswordRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserPasswordResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AssociateSoftwareTokenResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.DeviceType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GroupType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.NotAuthorizedException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.VerifySoftwareTokenResponseType;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CognitoAdminService covering Cognito (non-keycloak) code paths.
 * Uses Mockito to mock the CognitoIdentityProviderClient.
 */
class CognitoAdminServiceTest {

    private CognitoAdminService service;
    private CognitoIdentityProviderClient mockClient;

    @BeforeEach
    void setUp() throws Exception {
        service = spy(new CognitoAdminService());
        mockClient = mock(CognitoIdentityProviderClient.class);

        // Override client() to return our mock
        doReturn(mockClient).when(service).client();

        // Set fields via reflection (these are normally injected by CDI)
        setField("authProvider", "cognito");
        setField("userPoolId", "us-east-1_TestPool");
        setField("awsRegion", "us-east-1");
        setField("cognitoClientId", "test-client-id");
        setField("awsAccessKeyId", "test");
        setField("awsSecretAccessKey", "test");
        setField("awsEndpointOverride", Optional.empty());
    }

    private void setField(String name, Object value) throws Exception {
        Field field = CognitoAdminService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(service, value);
    }

    // ---- getUser (Cognito path) ----

    @Test
    void testGetUserCognitoPath() {
        AdminGetUserResponse getUserResp = AdminGetUserResponse.builder()
                .username("testuser")
                .enabled(true)
                .userStatus("CONFIRMED")
                .userAttributes(
                        AttributeType.builder().name("email").value("test@example.com").build(),
                        AttributeType.builder().name("email_verified").value("true").build())
                .userCreateDate(Instant.now())
                .userLastModifiedDate(Instant.now())
                .build();

        AdminListGroupsForUserResponse groupsResp = AdminListGroupsForUserResponse.builder()
                .groups(GroupType.builder().groupName("RegularUser").build())
                .build();

        when(mockClient.adminGetUser(any(AdminGetUserRequest.class))).thenReturn(getUserResp);
        when(mockClient.adminListGroupsForUser(any(AdminListGroupsForUserRequest.class))).thenReturn(groupsResp);

        var result = service.getUser("testuser");

        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertTrue(result.isEnabled());
        assertEquals(List.of("RegularUser"), result.getGroups());
    }

    // ---- deleteUser (Cognito path) ----

    @Test
    void testDeleteUserCognitoPath() {
        when(mockClient.adminDeleteUser(any(AdminDeleteUserRequest.class)))
                .thenReturn(AdminDeleteUserResponse.builder().build());

        boolean result = service.deleteUser("testuser");
        assertTrue(result);
        verify(mockClient).adminDeleteUser(any(AdminDeleteUserRequest.class));
    }

    @Test
    void testDeleteUserCognitoPathException() {
        when(mockClient.adminDeleteUser(any(AdminDeleteUserRequest.class)))
                .thenThrow(new RuntimeException("AWS error"));

        assertThrows(RuntimeException.class, () -> service.deleteUser("testuser"));
    }

    // ---- changePassword (Cognito path) ----

    @Test
    void testChangePasswordCognitoPathSuccess() {
        AdminInitiateAuthResponse authResp = AdminInitiateAuthResponse.builder()
                .session("test-session")
                .build();
        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class))).thenReturn(authResp);
        when(mockClient.adminSetUserPassword(any(AdminSetUserPasswordRequest.class)))
                .thenReturn(AdminSetUserPasswordResponse.builder().build());

        assertDoesNotThrow(() -> service.changePassword("testuser", "oldPass", "newPass"));

        verify(mockClient).adminInitiateAuth(any(AdminInitiateAuthRequest.class));
        verify(mockClient).adminSetUserPassword(any(AdminSetUserPasswordRequest.class));
    }

    @Test
    void testChangePasswordNotAuthorized() {
        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class)))
                .thenThrow(NotAuthorizedException.builder().message("Bad password").build());

        SecurityException ex = assertThrows(SecurityException.class,
                () -> service.changePassword("testuser", "wrongPass", "newPass"));
        assertEquals("Current password is incorrect", ex.getMessage());
    }

    @Test
    void testChangePasswordGenericException() {
        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class)))
                .thenThrow(new RuntimeException("Connection error"));

        assertThrows(CognitoOperationException.class,
                () -> service.changePassword("testuser", "oldPass", "newPass"));
    }

    @Test
    void testChangePasswordNullUsername() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword(null, "oldPass", "newPass"));
    }

    @Test
    void testChangePasswordBlankCurrentPassword() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword("user", "", "newPass"));
    }

    @Test
    void testChangePasswordBlankNewPassword() {
        assertThrows(IllegalArgumentException.class,
                () -> service.changePassword("user", "oldPass", "  "));
    }

    // ---- listTrustedDevices (Cognito path) ----

    @Test
    void testListTrustedDevicesCognitoPath() {
        Instant now = Instant.now();
        DeviceType device = DeviceType.builder()
                .deviceKey("device-1")
                .deviceCreateDate(now)
                .deviceLastModifiedDate(now)
                .deviceLastAuthenticatedDate(now)
                .deviceAttributes(
                        AttributeType.builder().name("device_name").value("Chrome Browser").build())
                .build();

        AdminListDevicesResponse resp = AdminListDevicesResponse.builder()
                .devices(device)
                .build();

        when(mockClient.adminListDevices(any(AdminListDevicesRequest.class))).thenReturn(resp);

        List<TrustedDevice> devices = service.listTrustedDevices("testuser");

        assertEquals(1, devices.size());
        assertEquals("device-1", devices.get(0).getDeviceKey());
        assertEquals("Chrome Browser", devices.get(0).getDeviceName());
    }

    @Test
    void testListTrustedDevicesEmptyList() {
        AdminListDevicesResponse resp = AdminListDevicesResponse.builder()
                .devices(List.of())
                .build();

        when(mockClient.adminListDevices(any(AdminListDevicesRequest.class))).thenReturn(resp);

        List<TrustedDevice> devices = service.listTrustedDevices("testuser");
        assertTrue(devices.isEmpty());
    }

    @Test
    void testListTrustedDevicesException() {
        when(mockClient.adminListDevices(any(AdminListDevicesRequest.class)))
                .thenThrow(new RuntimeException("Device list error"));

        assertThrows(CognitoOperationException.class,
                () -> service.listTrustedDevices("testuser"));
    }

    @Test
    void testListTrustedDevicesWithNullDates() {
        DeviceType device = DeviceType.builder()
                .deviceKey("device-2")
                .build();

        AdminListDevicesResponse resp = AdminListDevicesResponse.builder()
                .devices(device)
                .build();

        when(mockClient.adminListDevices(any(AdminListDevicesRequest.class))).thenReturn(resp);

        List<TrustedDevice> devices = service.listTrustedDevices("testuser");

        assertEquals(1, devices.size());
        assertEquals("", devices.get(0).getCreatedDate());
        assertEquals("", devices.get(0).getLastModifiedDate());
        assertEquals("", devices.get(0).getLastAuthenticatedDate());
        assertEquals("Unknown Device", devices.get(0).getDeviceName());
    }

    // ---- forgetDevice (Cognito path) ----

    @Test
    void testForgetDeviceCognitoPath() {
        when(mockClient.adminForgetDevice(any(AdminForgetDeviceRequest.class)))
                .thenReturn(AdminForgetDeviceResponse.builder().build());

        assertDoesNotThrow(() -> service.forgetDevice("testuser", "device-1"));
        verify(mockClient).adminForgetDevice(any(AdminForgetDeviceRequest.class));
    }

    @Test
    void testForgetDeviceException() {
        when(mockClient.adminForgetDevice(any(AdminForgetDeviceRequest.class)))
                .thenThrow(new RuntimeException("Forget error"));

        assertThrows(CognitoOperationException.class,
                () -> service.forgetDevice("testuser", "device-1"));
    }

    // ---- setMfaPreference (Cognito path) ----

    @Test
    void testSetMfaPreferenceCognitoPath() {
        when(mockClient.adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class)))
                .thenReturn(AdminSetUserMfaPreferenceResponse.builder().build());

        assertDoesNotThrow(() -> service.setMfaPreference("testuser", true, false, "TOTP"));

        ArgumentCaptor<AdminSetUserMfaPreferenceRequest> captor =
                ArgumentCaptor.forClass(AdminSetUserMfaPreferenceRequest.class);
        verify(mockClient).adminSetUserMFAPreference(captor.capture());

        AdminSetUserMfaPreferenceRequest request = captor.getValue();
        assertEquals("us-east-1_TestPool", request.userPoolId());
        assertEquals("testuser", request.username());
    }

    @Test
    void testSetMfaPreferenceSmsPreferred() {
        when(mockClient.adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class)))
                .thenReturn(AdminSetUserMfaPreferenceResponse.builder().build());

        assertDoesNotThrow(() -> service.setMfaPreference("testuser", false, true, "SMS"));
        verify(mockClient).adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class));
    }

    @Test
    void testSetMfaPreferenceException() {
        when(mockClient.adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class)))
                .thenThrow(new RuntimeException("MFA error"));

        assertThrows(CognitoOperationException.class,
                () -> service.setMfaPreference("testuser", true, false, "TOTP"));
    }

    // ---- setupTotp (Cognito path) ----

    @Test
    void testSetupTotpCognitoPath() {
        AdminInitiateAuthResponse authResp = AdminInitiateAuthResponse.builder()
                .session("totp-session")
                .build();
        AssociateSoftwareTokenResponse tokenResp = AssociateSoftwareTokenResponse.builder()
                .secretCode("ABCDEF123456")
                .build();

        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class))).thenReturn(authResp);
        when(mockClient.associateSoftwareToken(any(AssociateSoftwareTokenRequest.class))).thenReturn(tokenResp);

        MfaSetupResponse result = service.setupTotp("testuser");

        assertNotNull(result);
        assertEquals("ABCDEF123456", result.getSecretCode());
        assertTrue(result.getQrCodeUri().contains("ABCDEF123456"));
        assertTrue(result.getQrCodeUri().contains("testuser"));
    }

    @Test
    void testSetupTotpException() {
        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class)))
                .thenThrow(new RuntimeException("Auth error"));

        assertThrows(CognitoOperationException.class,
                () -> service.setupTotp("testuser"));
    }

    // ---- verifyTotp (Cognito path) ----

    @Test
    void testVerifyTotpSuccess() {
        AdminInitiateAuthResponse authResp = AdminInitiateAuthResponse.builder()
                .session("verify-session")
                .build();
        VerifySoftwareTokenResponse verifyResp = VerifySoftwareTokenResponse.builder()
                .status(VerifySoftwareTokenResponseType.SUCCESS)
                .build();

        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class))).thenReturn(authResp);
        when(mockClient.verifySoftwareToken(any(VerifySoftwareTokenRequest.class))).thenReturn(verifyResp);
        // setMfaPreference is called after success
        when(mockClient.adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class)))
                .thenReturn(AdminSetUserMfaPreferenceResponse.builder().build());

        boolean result = service.verifyTotp("testuser", "123456");

        assertTrue(result);
        verify(mockClient).verifySoftwareToken(any(VerifySoftwareTokenRequest.class));
        // After success, setMfaPreference should be called
        verify(mockClient).adminSetUserMFAPreference(any(AdminSetUserMfaPreferenceRequest.class));
    }

    @Test
    void testVerifyTotpFailure() {
        AdminInitiateAuthResponse authResp = AdminInitiateAuthResponse.builder()
                .session("verify-session")
                .build();
        VerifySoftwareTokenResponse verifyResp = VerifySoftwareTokenResponse.builder()
                .status(VerifySoftwareTokenResponseType.ERROR)
                .build();

        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class))).thenReturn(authResp);
        when(mockClient.verifySoftwareToken(any(VerifySoftwareTokenRequest.class))).thenReturn(verifyResp);

        boolean result = service.verifyTotp("testuser", "999999");

        assertFalse(result);
    }

    @Test
    void testVerifyTotpException() {
        when(mockClient.adminInitiateAuth(any(AdminInitiateAuthRequest.class)))
                .thenThrow(new RuntimeException("Verify error"));

        assertThrows(CognitoOperationException.class,
                () -> service.verifyTotp("testuser", "123456"));
    }

    // ---- Keycloak mock paths ----

    @Test
    void testChangePasswordKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        assertDoesNotThrow(() -> service.changePassword("user", "old", "new"));
    }

    @Test
    void testListTrustedDevicesKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        List<TrustedDevice> devices = service.listTrustedDevices("user");
        assertTrue(devices.isEmpty());
    }

    @Test
    void testForgetDeviceKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        assertDoesNotThrow(() -> service.forgetDevice("user", "device-1"));
    }

    @Test
    void testSetMfaPreferenceKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        assertDoesNotThrow(() -> service.setMfaPreference("user", true, false, "TOTP"));
    }

    @Test
    void testSetupTotpKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        MfaSetupResponse result = service.setupTotp("user");
        assertNotNull(result);
        assertEquals("MOCK_SECRET_FOR_DEV", result.getSecretCode());
        assertTrue(result.getQrCodeUri().contains("user"));
    }

    @Test
    void testVerifyTotpKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        boolean result = service.verifyTotp("user", "123456");
        assertTrue(result);
    }

    @Test
    void testGetUserKeycloakModeAdmin() throws Exception {
        setField("authProvider", "keycloak");

        var result = service.getUser("admin");
        assertEquals("admin", result.getUsername());
        assertTrue(result.getGroups().contains("AdminUser"));
    }

    @Test
    void testGetUserKeycloakModeRegular() throws Exception {
        setField("authProvider", "keycloak");

        var result = service.getUser("alice");
        assertEquals("alice", result.getUsername());
        assertEquals(List.of("RegularUser"), result.getGroups());
    }

    @Test
    void testDeleteUserKeycloakMode() throws Exception {
        setField("authProvider", "keycloak");

        boolean result = service.deleteUser("user");
        assertTrue(result);
    }
}
