variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "container_image" {
  description = "ECR image URI for the Quarkus backend"
  type        = string
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8080
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "cpu" {
  description = "Fargate task CPU (in CPU units)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Fargate task memory (in MiB)"
  type        = number
  default     = 1024
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "cognito_client_secret" {
  description = "Cognito App Client Secret"
  type        = string
  sensitive   = true
}

variable "dynamodb_table_arns" {
  description = "ARNs of DynamoDB tables the backend needs access to"
  type        = list(string)
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "profile_pictures_bucket_arn" {
  description = "ARN of the S3 bucket for profile pictures"
  type        = string
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/q/health/ready"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
