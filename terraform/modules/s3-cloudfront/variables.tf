variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "backend_origin_domain" {
  description = "Backend ALB domain name for /api/* routing"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Custom domain name for CloudFront (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
