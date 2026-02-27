# Terraform Infrastructure as Code

This directory contains Terraform configurations to deploy the Angular + Quarkus demo application on AWS.

## Architecture

```text
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  CloudFront  │────▶│   S3 Bucket   │     │   Cognito       │
│  (CDN)       │     │  (Frontend)   │     │  (User Pool)    │
└──────┬──────┘     └──────────────┘     └────────────────┘
       │
       │ /api/*
       ▼
┌──────────────┐     ┌──────────────┐
│   ALB         │────▶│   ECS Fargate │
│              │     │  (Quarkus)    │
└──────────────┘     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  DynamoDB     │
                     │  (Tables)     │
                     └──────────────┘
```

## Modules

| Module | Description |
| ------ | ----------- |
| `cognito` | AWS Cognito User Pool, groups, app client |
| `dynamodb` | DynamoDB tables (Links, Lists, Comments, Votes, Notifications, AuditLogs) |
| `s3-cloudfront` | S3 bucket for Angular SPA + CloudFront distribution |
| `ecs` | ECS Fargate service for Quarkus backend + ALB |

## Environments

| Environment | Description |
| ----------- | ----------- |
| `dev` | Development environment with minimal resources |
| `prod` | Production environment with HA and autoscaling |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [tflint](https://github.com/terraform-linters/tflint) (optional, for linting)
- Docker (for building container images)

## Quick Start

```bash
# Initialize (first time)
cd environments/dev
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

## State Management

Remote state is configured using S3 backend with DynamoDB locking.
Create the state bucket and lock table before first use:

```bash
aws s3 mb s3://angular-quarkus-demo-tfstate --region eu-central-1
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```

## Security Notes

- Never commit `.tfvars` files containing secrets
- Use AWS Secrets Manager or Parameter Store for sensitive values
- Enable Terraform state encryption at rest via S3 bucket policy
