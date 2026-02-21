package org.acme.graphql;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import org.acme.graphql.model.ChangePasswordInput;
import org.acme.graphql.model.CognitoUserPage;
import org.acme.graphql.model.CognitoUserView;
import org.acme.graphql.model.CurrentUserView;
import org.acme.graphql.model.MfaPreferenceInput;
import org.acme.graphql.model.MfaSetupResponse;
import org.acme.graphql.model.TrustedDevice;
import org.acme.graphql.model.UpdateUserInput;
import org.acme.service.CognitoAdminService;
import org.eclipse.microprofile.graphql.DefaultValue;
import org.eclipse.microprofile.graphql.GraphQLApi;
import org.eclipse.microprofile.graphql.Mutation;
import org.eclipse.microprofile.graphql.Name;
import org.eclipse.microprofile.graphql.Query;

import java.util.ArrayList;
import java.util.List;

@GraphQLApi
@Authenticated
public class UserGraphQLApi {

    private static final String ADMIN_ROLE = "AdminUser";
    private static final String AWS_ADMIN_ROLE = "admin";

    private final SecurityIdentity identity;
    private final CognitoAdminService cognitoAdminService;

    @Inject
    public UserGraphQLApi(SecurityIdentity identity, CognitoAdminService cognitoAdminService) {
        this.identity = identity;
        this.cognitoAdminService = cognitoAdminService;
    }

    @Query("me")
    public CurrentUserView me() {
        CurrentUserView me = new CurrentUserView();
        me.setUsername(identity.getPrincipal().getName());

        String email = identity.getAttribute("email");
        me.setEmail(email == null || email.isBlank() ? me.getUsername() : email);

        List<String> roles = new ArrayList<>(identity.getRoles());
        roles.sort(String::compareToIgnoreCase);
        me.setRoles(roles);
        return me;
    }

    @Query("users")
    @RolesAllowed({ADMIN_ROLE, AWS_ADMIN_ROLE})
    public CognitoUserPage users(
            @DefaultValue("0") int page,
            @DefaultValue("10") int size,
            @DefaultValue("username") @Name("sortBy") String sortBy,
            @DefaultValue("asc") String direction) {
        return cognitoAdminService.listUsers(page, size, sortBy, direction);
    }

    @Query("user")
    @Authenticated
    public CognitoUserView user(String username) {
        boolean isAdmin = identity.getRoles().contains(ADMIN_ROLE) || identity.getRoles().contains(AWS_ADMIN_ROLE);
        if (!isAdmin) {
             String me = identity.getPrincipal().getName();
             if (!me.equals(username)) {
                 throw new SecurityException("You are not authorized to view this user.");
             }
        }
        return cognitoAdminService.getUser(username);
    }

    @Mutation("updateUser")
    @RolesAllowed({ADMIN_ROLE, AWS_ADMIN_ROLE})
    public CognitoUserView updateUser(UpdateUserInput input) {
        return cognitoAdminService.updateUser(input);
    }

    @Mutation("deleteUser")
    @Authenticated
    public boolean deleteUser(String username) {
        boolean isAdmin = identity.getRoles().contains(ADMIN_ROLE) || identity.getRoles().contains(AWS_ADMIN_ROLE);
        if (!isAdmin) {
            String me = identity.getPrincipal().getName();
            if (!me.equals(username)) {
                throw new SecurityException("You are not authorized to delete this user.");
            }
        }
        return cognitoAdminService.deleteUser(username);
    }

    @Mutation("changePassword")
    @Authenticated
    public boolean changePassword(ChangePasswordInput input) {
        if (input == null) {
            throw new IllegalArgumentException("Input is required");
        }
        String username = identity.getPrincipal().getName();
        cognitoAdminService.changePassword(username, input.getCurrentPassword(), input.getNewPassword());
        return true;
    }

    @Query("groups")
    @RolesAllowed({ADMIN_ROLE, AWS_ADMIN_ROLE})
    public List<String> groups() {
        return List.of("RegularUser", ADMIN_ROLE, "OwnerUser", "NoPermissionsTestUser");
    }

    // ---- MFA Management ----

    @Query("trustedDevices")
    @Authenticated
    public List<TrustedDevice> trustedDevices() {
        String username = identity.getPrincipal().getName();
        return cognitoAdminService.listTrustedDevices(username);
    }

    @Mutation("forgetDevice")
    @Authenticated
    public boolean forgetDevice(String deviceKey) {
        String username = identity.getPrincipal().getName();
        cognitoAdminService.forgetDevice(username, deviceKey);
        return true;
    }

    @Mutation("setMfaPreference")
    @Authenticated
    public boolean setMfaPreference(MfaPreferenceInput input) {
        if (input == null) {
            throw new IllegalArgumentException("Input is required");
        }
        String username = identity.getPrincipal().getName();
        cognitoAdminService.setMfaPreference(username, input.isTotpEnabled(), input.isSmsEnabled(), input.getPreferredMethod());
        return true;
    }

    @Mutation("setupTotp")
    @Authenticated
    public MfaSetupResponse setupTotp() {
        String username = identity.getPrincipal().getName();
        return cognitoAdminService.setupTotp(username);
    }

    @Mutation("verifyTotp")
    @Authenticated
    public boolean verifyTotp(String code) {
        String username = identity.getPrincipal().getName();
        return cognitoAdminService.verifyTotp(username, code);
    }
}
