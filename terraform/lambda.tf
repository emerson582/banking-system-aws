data "archive_file" "card_approve_worker_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-cardservice/card-approve-worker"
  output_path = "../lambdas/lambdas-cardservice/card-approve-worker.zip"
}

resource "aws_lambda_function" "card_approve_worker" {
  function_name = "card-approve-worker"
  filename      = data.archive_file.card_approve_worker_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.card_approve_worker_zip.output_base64sha256

  timeout = 10

  environment {
    variables = {
      CARD_TABLE = "cards-table"
    }
  }
}

data "archive_file" "card_get_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-cardservice/card-get"
  output_path = "../lambdas/lambdas-cardservice/card-get.zip"
}

resource "aws_lambda_function" "get_cards_lambda" {

  function_name = "card-get"
  handler = "index.handler"
  runtime = "nodejs18.x"
  filename         = data.archive_file.card_get_zip.output_path
  source_code_hash = data.archive_file.card_get_zip.output_base64sha256

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      CARD_TABLE = "card-table"
    }
  }
}

# --- ZIP de la Lambda ---
data "archive_file" "card_purchase_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-cardservice/card-purchase"
  output_path = "../lambdas/lambdas-cardservice/card-purchase.zip"
}

resource "aws_lambda_function" "card_purchase_lambda" {
  function_name    = "card-purchase-lambda"
  filename         = data.archive_file.card_purchase_zip.output_path
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.card_purchase_zip.output_base64sha256

  environment {
    variables = {
      CARD_TABLE        = "card-table"
      TRANSACTION_TABLE = "transaction-table"
      REGION            = "us-east-1"
    }
  }
}

# --- ZIP de la Lambda ---
data "archive_file" "card_transaction_save_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-cardservice/card-transaction-save"
  output_path = "../lambdas/lambdas-cardservice/card-transaction-save.zip"
}

# --- Lambda Function ---
resource "aws_lambda_function" "card_transaction_save" {
  function_name    = "card-transaction-save"
  filename         = data.archive_file.card_transaction_save_zip.output_path
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn  
  source_code_hash = data.archive_file.card_transaction_save_zip.output_base64sha256

  timeout = 10
  memory_size = 128

  environment {
    variables = {
      REGION            = "us-east-1"
      CARD_TABLE        = "card-table"
      TRANSACTION_TABLE = "transaction-table"
    }
  }
}
data "archive_file" "card_paid_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-cardservice/card-paid"
  output_path = "../lambdas/lambdas-cardservice/card-paid.zip"
}

resource "aws_lambda_function" "card_paid_lambda" {
  function_name    = "card-paid-lambda"
  filename         = data.archive_file.card_paid_zip.output_path
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.card_paid_zip.output_base64sha256

  environment {
    variables = {
      CARD_TABLE        = "card-table"
      TRANSACTION_TABLE = "transaction-table"
      REGION            = "us-east-1"
    }
  }

  timeout = 10
}