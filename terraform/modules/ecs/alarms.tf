# ============================================================================
# CloudWatch Alarms for ECS / ALB monitoring
# Covers: 5xx rate, latency, auth failures, user registrations, user logins
# ============================================================================

# --- SNS Topic for alarm notifications ---
resource "aws_sns_topic" "alarms" {
  name = "${local.prefix}-alarms"
  tags = var.tags
}

# --- ALB Alarms ---

# 5xx Error Rate (backend errors)
resource "aws_cloudwatch_metric_alarm" "alb_5xx_rate" {
  alarm_name          = "${local.prefix}-alb-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  alarm_description   = "ALB 5xx errors exceed threshold"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "IF(requests > 0, errors / requests * 100, 0)"
    label       = "5xx Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# High Latency (p99 response time)
resource "aws_cloudwatch_metric_alarm" "alb_high_latency" {
  alarm_name          = "${local.prefix}-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 2.0
  alarm_description   = "ALB average response time exceeds 2 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# Unhealthy Host Count
resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "${local.prefix}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "One or more ECS tasks are unhealthy"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# --- Log-based Metric Filters & Alarms ---

# Authentication Failures (401/403 from application logs)
resource "aws_cloudwatch_log_metric_filter" "auth_failures" {
  name           = "${local.prefix}-auth-failures"
  log_group_name = aws_cloudwatch_log_group.main.name
  pattern        = "{ $.message = \"*401*\" || $.message = \"*403*\" || $.message = \"*Unauthorized*\" || $.message = \"*authentication*failed*\" }"

  metric_transformation {
    name          = "AuthFailureCount"
    namespace     = "${local.prefix}/Application"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "auth_failures" {
  alarm_name          = "${local.prefix}-auth-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuthFailureCount"
  namespace           = "${local.prefix}/Application"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High number of authentication failures detected"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# New User Registration (from application logs)
resource "aws_cloudwatch_log_metric_filter" "user_registration" {
  name           = "${local.prefix}-user-registration"
  log_group_name = aws_cloudwatch_log_group.main.name
  pattern        = "{ $.message = \"*new user registered*\" || $.message = \"*User registered*\" || $.message = \"*SIGN_UP*\" }"

  metric_transformation {
    name          = "UserRegistrationCount"
    namespace     = "${local.prefix}/Application"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "user_registration" {
  alarm_name          = "${local.prefix}-new-user-registered"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UserRegistrationCount"
  namespace           = "${local.prefix}/Application"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "New user registered in production"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# User Login Events (from application logs)
resource "aws_cloudwatch_log_metric_filter" "user_login" {
  name           = "${local.prefix}-user-login"
  log_group_name = aws_cloudwatch_log_group.main.name
  pattern        = "{ $.message = \"*user logged in*\" || $.message = \"*login successful*\" || $.message = \"*SIGN_IN*\" || $.message = \"*authenticated successfully*\" }"

  metric_transformation {
    name          = "UserLoginCount"
    namespace     = "${local.prefix}/Application"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "user_login" {
  alarm_name          = "${local.prefix}-user-login"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UserLoginCount"
  namespace           = "${local.prefix}/Application"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "User login detected in production"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# --- ECS Alarms ---

# High CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  alarm_name          = "${local.prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# High Memory Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_high_memory" {
  alarm_name          = "${local.prefix}-ecs-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS memory utilization exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}
