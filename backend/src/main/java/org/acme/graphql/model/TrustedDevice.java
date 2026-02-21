package org.acme.graphql.model;

public class TrustedDevice {
    private String deviceKey;
    private String deviceName;
    private String lastAuthenticatedDate;
    private String createdDate;
    private String lastModifiedDate;

    public String getDeviceKey() { return deviceKey; }
    public void setDeviceKey(String deviceKey) { this.deviceKey = deviceKey; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getLastAuthenticatedDate() { return lastAuthenticatedDate; }
    public void setLastAuthenticatedDate(String lastAuthenticatedDate) {
        this.lastAuthenticatedDate = lastAuthenticatedDate;
    }

    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }

    public String getLastModifiedDate() { return lastModifiedDate; }
    public void setLastModifiedDate(String lastModifiedDate) { this.lastModifiedDate = lastModifiedDate; }
}
