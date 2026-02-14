package org.acme.graphql;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import org.acme.graphql.model.CognitoUserPage;
import org.acme.graphql.model.CognitoUserView;
import org.acme.graphql.model.CurrentUserView;
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

    @Inject
    SecurityIdentity identity;

    @Inject
    CognitoAdminService cognitoAdminService;

    @Query("me")
    public CurrentUserView me() {
        CurrentUserView me = new CurrentUserView();
        me.username = identity.getPrincipal().getName();

        String email = identity.getAttribute("email");
        me.email = email == null || email.isBlank() ? me.username : email;

        me.roles = new ArrayList<>(identity.getRoles());
        me.roles.sort(String::compareToIgnoreCase);
        return me;
    }

    @Query("users")
    @RolesAllowed({"AdminUser", "admin"})
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
        boolean isAdmin = identity.getRoles().contains("AdminUser") || identity.getRoles().contains("admin");
        if (!isAdmin) {
             String me = identity.getPrincipal().getName();
             if (!me.equals(username)) {
                 throw new SecurityException("You are not authorized to view this user.");
             }
        }
        return cognitoAdminService.getUser(username);
    }

    @Mutation("updateUser")
    @RolesAllowed({"AdminUser", "admin"})
    public CognitoUserView updateUser(UpdateUserInput input) {
        return cognitoAdminService.updateUser(input);
    }

    @Mutation("deleteUser")
    @Authenticated
    public boolean deleteUser(String username) {
        boolean isAdmin = identity.getRoles().contains("AdminUser") || identity.getRoles().contains("admin");
        if (!isAdmin) {
            String me = identity.getPrincipal().getName();
            if (!me.equals(username)) {
                throw new SecurityException("You are not authorized to delete this user.");
            }
        }
        return cognitoAdminService.deleteUser(username);
    }

    @Query("groups")
    @RolesAllowed({"AdminUser", "admin"})
    public List<String> groups() {
        return List.of("RegularUser", "AdminUser", "OwnerUser", "NoPermissionsTestUser");
    }
}
