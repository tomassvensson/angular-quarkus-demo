package org.acme.graphql.model;

import java.time.Instant;
import java.util.List;

public class CognitoUserView {
    public String username;
    public String email;
    public boolean emailVerified;
    public String confirmationStatus;
    public String status;
    public boolean enabled;
    public Instant created;
    public Instant lastUpdatedTime;
    public Instant modified;
    public String mfaSetting;
    public List<String> groups;
}
