package org.acme.graphql.model;

public class MfaSetupResponse {
    private String secretCode;
    private String qrCodeUri;

    public String getSecretCode() { return secretCode; }
    public void setSecretCode(String secretCode) { this.secretCode = secretCode; }

    public String getQrCodeUri() { return qrCodeUri; }
    public void setQrCodeUri(String qrCodeUri) { this.qrCodeUri = qrCodeUri; }
}
