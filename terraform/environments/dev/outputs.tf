output "cloudfront_url" {
  value = "https://${module.cdn.cloudfront_domain_name}"
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "s3_bucket_name" {
  value = module.cdn.s3_bucket_name
}

output "alb_dns_name" {
  value = module.ecs.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.ecs.ecs_cluster_name
}
