terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  prefix = "${var.project_name}-${var.environment}"
}

resource "aws_dynamodb_table" "links" {
  name         = "${local.prefix}-Links"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "lists" {
  name         = "${local.prefix}-Lists"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "owner"
    type = "S"
  }

  global_secondary_index {
    name            = "OwnerIndex"
    hash_key        = "owner"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "comments" {
  name         = "${local.prefix}-Comments"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "entityId"
    type = "S"
  }

  global_secondary_index {
    name            = "EntityIndex"
    hash_key        = "entityId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "votes" {
  name         = "${local.prefix}-Votes"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "entityId"
    type = "S"
  }

  global_secondary_index {
    name            = "EntityIndex"
    hash_key        = "entityId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "notifications" {
  name         = "${local.prefix}-Notifications"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "audit_logs" {
  name         = "${local.prefix}-AuditLogs"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "entityId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "EntityIndex"
    hash_key        = "entityId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}
