data "archive_file" "notification_email_zip" {
  type        = "zip"
  source_dir  = "../lambdas/notification-service/notification-email"
  output_path = "../lambdas/notification-service/notification-email.zip"
}



resource "aws_lambda_function" "notification_email" {
  function_name = "notification-email"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_role.arn
  timeout       = 20
  filename      = data.archive_file.notification_email_zip.output_path
  environment {
    variables = {
      REGION       = "us-east-1"
      SENDER_EMAIL = "emerson.lopez@unicolombo.edu.co"
      SQS_URL      = "https://sqs.us-east-1.amazonaws.com/561764227404/notification-email-sqs"
    }
  }
}

