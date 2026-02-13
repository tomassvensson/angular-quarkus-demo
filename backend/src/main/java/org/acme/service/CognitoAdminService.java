package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.graphql.model.CognitoUserPage;
import org.acme.graphql.model.CognitoUserView;
import org.acme.graphql.model.UpdateUserInput;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminDisableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminEnableUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminListGroupsForUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminRemoveUserFromGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminUpdateUserAttributesRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class CognitoAdminService {

    @ConfigProperty(name = "aws.region")
    String awsRegion;

    @ConfigProperty(name = "cognito.user-pool-id")
    String userPoolId;

    public CognitoUserPage listUsers(int page, int size, String sortBy, String direction) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));

        List<CognitoUserView> all = fetchAllUsers();
        Comparator<CognitoUserView> comparator = comparatorFor(sortBy);
        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }
        all.sort(comparator);

        int fromIndex = Math.min(safePage * safeSize, all.size());
        int toIndex = Math.min(fromIndex + safeSize, all.size());

        CognitoUserPage result = new CognitoUserPage();
        result.items = all.subList(fromIndex, toIndex);
        result.page = safePage;
        result.size = safeSize;
        result.total = all.size();
        return result;
    }

    public CognitoUserView getUser(String username) {
        try (CognitoIdentityProviderClient client = client()) {
            AdminGetUserResponse response = client.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
            List<String> groups = groupsForUser(client, username);
            return map(response, groups);
        }
    }

    public CognitoUserView updateUser(UpdateUserInput input) {
        if (input == null || input.username == null || input.username.isBlank()) {
            throw new IllegalArgumentException("username is required");
        }

        String username = input.username.trim();
        try (CognitoIdentityProviderClient client = client()) {
            if (input.email != null && !input.email.isBlank()) {
                client.adminUpdateUserAttributes(AdminUpdateUserAttributesRequest.builder()
                        .userPoolId(userPoolId)
                        .username(username)
                        .userAttributes(
                                AttributeType.builder().name("email").value(input.email.trim()).build(),
                                AttributeType.builder().name("email_verified").value("true").build())
                        .build());
            }

            if (input.enabled != null) {
                if (input.enabled) {
                    client.adminEnableUser(AdminEnableUserRequest.builder()
                            .userPoolId(userPoolId)
                            .username(username)
                            .build());
                } else {
                    client.adminDisableUser(AdminDisableUserRequest.builder()
                            .userPoolId(userPoolId)
                            .username(username)
                            .build());
                }
            }

            if (input.groups != null) {
                Set<String> desired = new HashSet<>();
                for (String group : input.groups) {
                    if (group != null && !group.isBlank()) {
                        desired.add(group.trim());
                    }
                }

                List<String> currentGroups = groupsForUser(client, username);
                Set<String> current = new HashSet<>(currentGroups);

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

            AdminGetUserResponse updated = client.adminGetUser(AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .build());
            List<String> groups = groupsForUser(client, username);
            return map(updated, groups);
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
            case "email" -> Comparator.comparing(user -> safe(user.email));
            case "status" -> Comparator.comparing(user -> safe(user.status));
            case "confirmationstatus" -> Comparator.comparing(user -> safe(user.confirmationStatus));
            case "emailverified" -> Comparator.comparing(user -> user.emailVerified);
            case "created" -> Comparator.comparing(user -> safeInstant(user.created));
            case "lastupdatedtime" -> Comparator.comparing(user -> safeInstant(user.lastUpdatedTime));
            case "modified" -> Comparator.comparing(user -> safeInstant(user.modified));
            case "mfasetting" -> Comparator.comparing(user -> safe(user.mfaSetting));
            case "enabled" -> Comparator.comparing(user -> user.enabled);
            default -> Comparator.comparing(user -> safe(user.username));
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

    private CognitoUserView map(UserType user, List<String> groups) {
        CognitoUserView view = new CognitoUserView();
        view.username = user.username();
        view.email = attributeValue(user.attributes(), "email");
        view.emailVerified = parseBoolean(attributeValue(user.attributes(), "email_verified"));
        view.confirmationStatus = user.userStatusAsString();
        view.enabled = Boolean.TRUE.equals(user.enabled());
        view.status = view.enabled ? "Enabled" : "Disabled";
        view.created = user.userCreateDate();
        view.lastUpdatedTime = user.userLastModifiedDate();
        view.modified = user.userLastModifiedDate();
        view.mfaSetting = "Unknown";
        view.groups = groups;
        return view;
    }

    private CognitoUserView map(AdminGetUserResponse user, List<String> groups) {
        CognitoUserView view = new CognitoUserView();
        view.username = user.username();
        view.email = attributeValue(user.userAttributes(), "email");
        view.emailVerified = parseBoolean(attributeValue(user.userAttributes(), "email_verified"));
        view.confirmationStatus = user.userStatusAsString();
        view.enabled = Boolean.TRUE.equals(user.enabled());
        view.status = view.enabled ? "Enabled" : "Disabled";
        view.created = user.userCreateDate();
        view.lastUpdatedTime = user.userLastModifiedDate();
        view.modified = user.userLastModifiedDate();
        view.mfaSetting = toMfaSetting(user.userMFASettingList());
        view.groups = groups;
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
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(awsRegion))
                .build();
    }
}
