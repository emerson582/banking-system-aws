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
resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:dynamodb:*:*:table/user-table",
          "arn:aws:dynamodb:*:*:table/user-table/index/email-index"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        Effect = "Allow",
        Resource = "arn:aws:s3:::banking-system-terraform-bucket-emerson/*"
      },
      {
        Action = "logs:*",
        Effect = "Allow",
        Resource = "*"
      }
    ]
  })
}




resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}