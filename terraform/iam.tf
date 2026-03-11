resource "aws_iam_role" "lambda_role" {
  name = "banking_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Logs para Lambda
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Permisos para que Lambda pueda procesar SQS
resource "aws_iam_role_policy_attachment" "lambda_sqs_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

# DynamoDB para card-table y transaction-table
resource "aws_iam_policy" "card_table_policy" {
  name = "card-table-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:us-east-1:561764227404:table/card-table",
          "arn:aws:dynamodb:us-east-1:561764227404:table/transaction-table"
        ]
      }
    ]
  })
}

# DynamoDB user-table + S3
resource "aws_iam_policy" "lambda_policy" {
  name = "lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [

      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          "arn:aws:dynamodb:us-east-1:561764227404:table/user-table",
          "arn:aws:dynamodb:us-east-1:561764227404:table/user-table/index/email-index"
        ]
      },

      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::banking-system-terraform-bucket-emerson/*"
      }

    ]
  })
}

# Permisos SQS
resource "aws_iam_policy" "sqs_policy" {
  name = "SQS_queris"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "arn:aws:sqs:us-east-1:561764227404:CardRequestQueue",
          "arn:aws:sqs:us-east-1:561764227404:notification-email-sqs"
        ]
      }
    ]
  })
}

# Attach policies

resource "aws_iam_role_policy_attachment" "card_table_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.card_table_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role_policy_attachment" "sqs_policy_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.sqs_policy.arn
}