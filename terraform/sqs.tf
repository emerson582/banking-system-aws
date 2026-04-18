resource "aws_sqs_queue" "transaction_queue" {
  name = "transaction-queue"

  visibility_timeout_seconds = 30
  message_retention_seconds  = 86400

  tags = {
    Environment = "Dev"
    Project     = "BankingSystem"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name = "notification-queue"

  visibility_timeout_seconds = 30
  message_retention_seconds  = 86400

  tags = {
    Environment = "Dev"
    Project     = "BankingSystem"
  }
}

resource "aws_sqs_queue" "notification_queue_sqs" {
  name = "notification-email-sqs"
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn  = aws_sqs_queue.notification_queue_sqs.arn
  function_name     = aws_lambda_function.notification_email.arn
  batch_size        = 5
  enabled           = true
}

resource "aws_sqs_queue" "payment_start_queue" {
  name = "payment-start-queue"
}

resource "aws_sqs_queue" "payment_process_queue" {
  name = "payment-process-queue"
}

resource "aws_lambda_event_source_mapping" "check_balance_trigger" {
  event_source_arn = aws_sqs_queue.payment_start_queue.arn
  function_name    = aws_lambda_function.check_balance.arn
}

resource "aws_lambda_event_source_mapping" "transaction_trigger" {
  event_source_arn = aws_sqs_queue.payment_process_queue.arn
  function_name    = aws_lambda_function.transaction.arn
  batch_size       = 1
}