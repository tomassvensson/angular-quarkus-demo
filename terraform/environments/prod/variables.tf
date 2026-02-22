variable "project_name" {
  description = "Project name"
  type        = string
  default     = "angular-quarkus-demo"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "vpc_id" {
  description = "VPC ID for ECS deployment"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnets for ALB"
  type        = list(string)
}

variable "container_image" {
  description = "Docker image URI for Quarkus backend"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Custom domain for CloudFront"
  type        = string
  default     = ""
}
