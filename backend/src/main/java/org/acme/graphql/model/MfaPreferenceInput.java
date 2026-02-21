package org.acme.graphql.model;

import org.eclipse.microprofile.graphql.Input;

@Input("MfaPreferenceInput")
public class MfaPreferenceInput {
    private boolean totpEnabled;
    private boolean smsEnabled;
    private String preferredMethod; // "TOTP", "SMS", or "NONE"

    public boolean isTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(boolean totpEnabled) { this.totpEnabled = totpEnabled; }

    public boolean isSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(boolean smsEnabled) { this.smsEnabled = smsEnabled; }

    public String getPreferredMethod() { return preferredMethod; }
    public void setPreferredMethod(String preferredMethod) { this.preferredMethod = preferredMethod; }
}
