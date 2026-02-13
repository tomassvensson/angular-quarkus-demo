package org.acme.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class LoginPolicyService {

    @ConfigProperty(name = "app.test.disallowed-usernames", defaultValue = "")
    String disallowedUsernamesRaw;

    public boolean isDisallowedPrincipal(String principalOrEmail) {
        if (principalOrEmail == null || principalOrEmail.isBlank()) {
            return false;
        }

        String normalized = principalOrEmail.trim().toLowerCase(Locale.ROOT);
        String localPart = extractLocalPart(normalized);
        return disallowedUsernames().contains(localPart);
    }

    Set<String> disallowedUsernames() {
        return Arrays.stream(disallowedUsernamesRaw.split(","))
                .map(String::trim)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    private String extractLocalPart(String normalizedPrincipalOrEmail) {
        int atIndex = normalizedPrincipalOrEmail.indexOf('@');
        if (atIndex <= 0) {
            return normalizedPrincipalOrEmail;
        }
        return normalizedPrincipalOrEmail.substring(0, atIndex);
    }
}
