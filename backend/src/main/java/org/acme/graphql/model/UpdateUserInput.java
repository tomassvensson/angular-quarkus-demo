package org.acme.graphql.model;

import java.util.List;

public class UpdateUserInput {
    public String username;
    public String email;
    public Boolean enabled;
    public List<String> groups;
}
