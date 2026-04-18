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

resource "aws_s3_bucket" "catalog_bucket" {
  bucket = "catalog-bucket-emerson"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "payment-frontend-emerson"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_object" "frontend_files" {
  for_each = fileset("${path.module}/../fronted/payment-app/dist/payment-app/browser", "**")

  bucket = aws_s3_bucket.frontend.bucket
  key    = each.value

  source = "${path.module}/../fronted/payment-app/dist/payment-app/browser/${each.value}"

  etag = filemd5("${path.module}/../fronted/payment-app/dist/payment-app/browser/${each.value}")

  content_type = lookup({
    html = "text/html"
    js   = "application/javascript"
    css  = "text/css"
    json = "application/json"
    png  = "image/png"
    jpg  = "image/jpeg"
    svg  = "image/svg+xml"
  }, split(".", each.value)[length(split(".", each.value)) - 1], "binary/octet-stream")
}