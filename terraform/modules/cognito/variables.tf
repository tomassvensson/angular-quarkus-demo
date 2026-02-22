# Cognito Module

<!-- BEGIN_TF_DOCS -->
Creates an AWS Cognito User Pool with user groups and app client
for the Angular Quarkus demo application.
<!-- END_TF_DOCS -->

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "callback_urls" {
  description = "OAuth callback URLs (e.g. CloudFront domain)"
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth logout URLs"
  type        = list(string)
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
