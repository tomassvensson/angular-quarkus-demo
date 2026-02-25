output "alb_dns_name" {
  description = "ALB DNS name (use as backend_origin_domain for CloudFront)"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  value = aws_lb.main.arn
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.main.name
}

output "alb_listener_arn" {
  description = "HTTPS listener ARN (attach ACM cert here)"
  value       = aws_lb_listener.http.arn
}

output "alarms_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}
