locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

module "cognito" {
  source = "../../modules/cognito"

  project_name  = var.project_name
  environment   = var.environment
  callback_urls = var.custom_domain != "" ? ["https://${var.custom_domain}/login"] : ["https://${module.cdn.cloudfront_domain_name}/login"]
  logout_urls   = var.custom_domain != "" ? ["https://${var.custom_domain}"] : ["https://${module.cdn.cloudfront_domain_name}"]
  tags          = local.tags
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name                  = var.project_name
  environment                   = var.environment
  billing_mode                  = "PAY_PER_REQUEST"
  enable_point_in_time_recovery = true
  tags                          = local.tags
}

module "ecs" {
  source = "../../modules/ecs"

  project_name                = var.project_name
  environment                 = var.environment
  vpc_id                      = var.vpc_id
  private_subnet_ids          = var.private_subnet_ids
  public_subnet_ids           = var.public_subnet_ids
  container_image             = var.container_image
  desired_count               = 2
  cpu                         = 512
  memory                      = 1024
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_client_id           = module.cognito.client_id
  cognito_client_secret       = module.cognito.client_secret
  dynamodb_table_arns         = module.dynamodb.table_arns
  profile_pictures_bucket_arn = "arn:aws:s3:::toms-profile-pictures"
  aws_region                  = var.aws_region
  tags                        = local.tags
}

module "cdn" {
  source = "../../modules/s3-cloudfront"

  project_name          = var.project_name
  environment           = var.environment
  backend_origin_domain = module.ecs.alb_dns_name
  acm_certificate_arn   = var.acm_certificate_arn
  custom_domain         = var.custom_domain
  tags                  = local.tags
}
