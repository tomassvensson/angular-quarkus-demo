package org.acme.graphql.model;

import org.eclipse.microprofile.graphql.Input;

@Input("ChangePasswordInput")
public class ChangePasswordInput {
    private String currentPassword;
    private String newPassword;

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
