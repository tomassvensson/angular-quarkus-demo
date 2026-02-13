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
    @RolesAllowed("AdminUser")
    public CognitoUserPage users(
            @DefaultValue("0") int page,
            @DefaultValue("10") int size,
            @DefaultValue("username") @Name("sortBy") String sortBy,
            @DefaultValue("asc") String direction) {
        return cognitoAdminService.listUsers(page, size, sortBy, direction);
    }

    @Query("user")
    @RolesAllowed("AdminUser")
    public CognitoUserView user(String username) {
        return cognitoAdminService.getUser(username);
    }

    @Mutation("updateUser")
    @RolesAllowed("AdminUser")
    public CognitoUserView updateUser(UpdateUserInput input) {
        return cognitoAdminService.updateUser(input);
    }

    @Query("groups")
    @RolesAllowed("AdminUser")
    public List<String> groups() {
        return List.of("RegularUser", "AdminUser", "OwnerUser", "NoPermissionsTestUser");
    }
}
