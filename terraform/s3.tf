resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "lambda-s3-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::banking-system-terraform-bucket-emerson/*"
      }
    ]
  })
}
resource "aws_s3_bucket" "avatars" {
  bucket        = "banking-system-terraform-bucket-emerson"
  force_destroy = true   # Borra automáticamente todos los objetos y versiones al destruir
}