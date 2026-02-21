package org.acme.service;

/**
 * Custom exception for Cognito service operation failures.
 */
public class CognitoOperationException extends RuntimeException {
    public CognitoOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
