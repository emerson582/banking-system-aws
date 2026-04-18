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

resource "aws_lambda_function" "card_purchase" {
  function_name = "card-purchase-lambda"
  filename      = data.archive_file.card_purchase_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.card_purchase_zip.output_base64sha256

  environment {
    variables = {
      CARD_TABLE        = "card-table"
      TRANSACTION_TABLE = "transaction-table"
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

data "archive_file" "catalog_update_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-catalog/update-catalog"
  output_path = "../lambdas/lambdas-catalog/update-catalog.zip"
}

resource "aws_lambda_function" "catalog_update" {
  function_name = "catalog-update"
  filename      = data.archive_file.catalog_update_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.catalog_update_zip.output_base64sha256

  timeout = 30

  environment {
    variables = {
      REGION      = "us-east-1"
      BUCKET_NAME = aws_s3_bucket.catalog_bucket.bucket
      REDIS_HOST  = aws_elasticache_cluster.redis.cache_nodes[0].address
      REDIS_PORT  = "6379"
    }
  }

   vpc_config {
    subnet_ids = [
      aws_subnet.subnet_1.id,
      aws_subnet.subnet_2.id
    ]

    security_group_ids = [
      aws_security_group.lambda_sg.id
    ]
  }
}

data "archive_file" "catalog_get_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-catalog/get-catalog"
  output_path = "../lambdas/lambdas-catalog/get-catalog.zip"
}

resource "aws_lambda_function" "catalog_get" {
  function_name = "catalog-get"
  filename      = data.archive_file.catalog_get_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.catalog_get_zip.output_base64sha256

  timeout = 10

  environment {
    variables = {
      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address
      REDIS_PORT = "6379"
    }
  }

  vpc_config {
    subnet_ids = [
      aws_subnet.subnet_1.id,
      aws_subnet.subnet_2.id
    ]

    security_group_ids = [
      aws_security_group.lambda_sg.id
    ]
  }
}

data "archive_file" "payment_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-payment/payment"
  output_path = "../lambdas/lambdas-payment/payment.zip"
}

resource "aws_lambda_function" "payment" {
  function_name = "start-payment"
  filename      = data.archive_file.payment_zip.output_path
  source_code_hash = data.archive_file.payment_zip.output_base64sha256

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      CARD_TABLE   = "card-table"
      PAYMENT_TABLE = "payment-table"
      SQS_URL      = aws_sqs_queue.payment_start_queue.id
    }
  }
}

data "archive_file" "check_balance_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-payment/check-balance"
  output_path = "../lambdas/lambdas-payment/check-balance.zip"
}

resource "aws_lambda_function" "check_balance" {
  function_name = "check-balance"
  filename      = data.archive_file.check_balance_zip.output_path
  source_code_hash = data.archive_file.check_balance_zip.output_base64sha256
  timeout = 10

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      PAYMENT_TABLE = "payment-table"
      NEXT_QUEUE    = aws_sqs_queue.payment_process_queue.id
    }
  }
}

data "archive_file" "transaction_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-payment/transaction"
  output_path = "../lambdas/lambdas-payment/transaction.zip"
}

resource "aws_lambda_function" "transaction" {
  function_name = "transaction"
  filename      = data.archive_file.transaction_zip.output_path
  source_code_hash = data.archive_file.transaction_zip.output_base64sha256
   timeout = 10

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      PAYMENT_TABLE = "payment-table"
      CARD_TABLE        = "card-table"
    TRANSACTION_TABLE = "transaction-table"
    }
  }
}