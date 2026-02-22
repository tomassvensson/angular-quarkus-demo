output "links_table_name" {
  value = aws_dynamodb_table.links.name
}

output "lists_table_name" {
  value = aws_dynamodb_table.lists.name
}

output "comments_table_name" {
  value = aws_dynamodb_table.comments.name
}

output "votes_table_name" {
  value = aws_dynamodb_table.votes.name
}

output "notifications_table_name" {
  value = aws_dynamodb_table.notifications.name
}

output "audit_logs_table_name" {
  value = aws_dynamodb_table.audit_logs.name
}

output "table_arns" {
  description = "ARNs of all DynamoDB tables"
  value = [
    aws_dynamodb_table.links.arn,
    aws_dynamodb_table.lists.arn,
    aws_dynamodb_table.comments.arn,
    aws_dynamodb_table.votes.arn,
    aws_dynamodb_table.notifications.arn,
    aws_dynamodb_table.audit_logs.arn,
  ]
}
