package org.acme.graphql.model;

import java.util.List;

public class CognitoUserPage {
    public List<CognitoUserView> items;
    public int page;
    public int size;
    public long total;
}
