
# Lambda: register-user

data "archive_file" "register_user_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-user/register-user"
  output_path = "../lambdas/lambdas-user/register-user.zip"
}

resource "aws_lambda_function" "register_user" {
  function_name = "register-user"
  filename      = data.archive_file.register_user_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.register_user_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME  = "user-table"
      BUCKET_NAME = "banking-system-terraform-bucket-emerson"
      REGION      = "us-east-1"
    }
  }
}

# Lambda: login-user

data "archive_file" "login_user_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-user/login-user"
  output_path = "../lambdas/lambdas-user/login-user.zip"
}

resource "aws_lambda_function" "login_user" {
  function_name = "login-user"
  filename      = data.archive_file.login_user_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn

  source_code_hash = data.archive_file.login_user_zip.output_base64sha256
}

# Lambda: upload-user
data "archive_file" "update_user_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-user/update-user"
  output_path = "../lambdas/lambdas-user/update-user.zip"
}

resource "aws_lambda_function" "update_user" {
  function_name = "update-user"
  filename      = data.archive_file.update_user_zip.output_path
  handler       = "index.handler"  
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.update_user_zip.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = "banking-system-terraform-bucket-emerson"
      TABLE_NAME  = "user-table"
      REGION      = "us-east-1"
    }
  }
}

#lambda get profile
data "archive_file" "get_profile_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-user/get-profile"
  output_path = "../lambdas/lambdas-user/get-profile.zip"
}

resource "aws_lambda_function" "get_profile" {
  function_name = "get-profile"
  filename      = data.archive_file.get_profile_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME = "user-table"
    }
  }
}
# REST API Gateway register
resource "aws_api_gateway_rest_api" "banking_api" {
  name = "banking-api"
}

resource "aws_api_gateway_resource" "register_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_rest_api.banking_api.root_resource_id
  path_part   = "register"
}

resource "aws_api_gateway_method" "register_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.register_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "register_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.register_resource.id
  http_method             = aws_api_gateway_method.register_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.register_user.invoke_arn
}

resource "aws_lambda_permission" "api_gateway_permission_register" {
  statement_id  = "AllowAPIGatewayInvokeRegister"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/register"
}
# REST API Gateway login

resource "aws_api_gateway_resource" "login_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_rest_api.banking_api.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = "POST"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.login_resource.id
  http_method             = aws_api_gateway_method.login_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.login_user.invoke_arn
}
resource "aws_lambda_permission" "api_gateway_permission_login" {
  statement_id  = "AllowAPIGatewayInvokeLogin"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/login"
}

# API Gateway upload
resource "aws_api_gateway_resource" "profile_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_rest_api.banking_api.root_resource_id
  path_part   = "profile"
}

resource "aws_api_gateway_resource" "profile_user_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.profile_resource.id
  path_part   = "{user_id}"
}

resource "aws_api_gateway_method" "update_user_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.profile_user_resource.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_user_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.profile_user_resource.id
  http_method             = "PUT"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_user.invoke_arn
}

resource "aws_lambda_permission" "api_gateway_permission_update_user" {
  statement_id  = "AllowAPIGatewayInvokeUpdateUser"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/PUT/profile/*"
}

# Lambda: upload-avatar
data "archive_file" "upload_avatar_zip" {
  type        = "zip"
  source_dir  = "../lambdas/lambdas-user/upload-avatar"
  output_path = "../lambdas/lambdas-user/upload-avatar.zip"
}

resource "aws_lambda_function" "upload_avatar" {
  function_name = "upload-avatar"
  filename      = data.archive_file.upload_avatar_zip.output_path
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_role.arn
  source_code_hash = data.archive_file.upload_avatar_zip.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = "banking-system-terraform-bucket-emerson"
      TABLE_NAME  = "user-table"
      REGION      = "us-east-1"
    }
  }
}
# api gateaway upload avatar
# --- Data: recurso base /profile existente ---
data "aws_api_gateway_resource" "avatar" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  path        = "/profile/{user_id}"
}
# --- Recurso dinámico: /profile/{user_id} ---
resource "aws_api_gateway_resource" "avatar_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = data.aws_api_gateway_resource.avatar.id
  path_part   = "avatar"
}


# --- Método POST para subir avatar ---
resource "aws_api_gateway_method" "upload_avatar_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.avatar_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# --- Integración Lambda con API Gateway ---
resource "aws_api_gateway_integration" "upload_avatar_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.avatar_resource.id
  http_method             = aws_api_gateway_method.upload_avatar_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.upload_avatar.invoke_arn
}

# --- Permiso Lambda para que API Gateway invoque ---
resource "aws_lambda_permission" "upload_avatar_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_avatar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/profile/*/avatar"
}


# --- Método GET para /profile/{user_id} ---
resource "aws_api_gateway_method" "get_profile" {

  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.profile_user_resource.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.user_id" = true
  }

}

# --- Integración Lambda GET profile ---
resource "aws_api_gateway_integration" "get_profile" {

  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  resource_id = aws_api_gateway_resource.profile_user_resource.id
  http_method = aws_api_gateway_method.get_profile.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_profile.invoke_arn

}

# --- Permiso Lambda para API Gateway ---
resource "aws_lambda_permission" "apigw_get_profile" {

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_profile.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "cards_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_rest_api.banking_api.root_resource_id
  path_part   = "cards"

}

resource "aws_api_gateway_resource" "cards_document" {

  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.cards_resource.id
  path_part   = "{document}"

}
resource "aws_api_gateway_method" "get_cards_method" {

  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.cards_document.id
  http_method   = "GET"
  authorization = "NONE"

}

resource "aws_api_gateway_integration" "get_cards_integration" {

  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  resource_id = aws_api_gateway_resource.cards_document.id
  http_method = aws_api_gateway_method.get_cards_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_cards_lambda.invoke_arn

}

resource "aws_lambda_permission" "api_gateway_get_cards" {

  statement_id  = "AllowExecutionFromAPIGatewayGetCards"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cards_lambda.function_name
  principal     = "apigateway.amazonaws.com"

}

# Recurso /cards/purchase
resource "aws_api_gateway_resource" "cards_purchase" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.cards_resource.id # ya tienes /cards
  path_part   = "purchase"
}

# Método POST
resource "aws_api_gateway_method" "cards_purchase_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.cards_purchase.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integración Lambda
resource "aws_api_gateway_integration" "cards_purchase_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.cards_purchase.id
  http_method             = aws_api_gateway_method.cards_purchase_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.card_purchase_lambda.invoke_arn
}

# Permisos Lambda para API Gateway
resource "aws_lambda_permission" "api_gateway_permission_cards_purchase" {
  statement_id  = "AllowAPIGatewayInvokeCardPurchase"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.card_purchase_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/cards/purchase"
}

# --- Recurso /transactions/save/{card_id} ---
resource "aws_api_gateway_resource" "transactions_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_rest_api.banking_api.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_resource" "transactions_save_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.transactions_resource.id
  path_part   = "save"
}

resource "aws_api_gateway_resource" "transactions_save_card_resource" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.transactions_save_resource.id
  path_part   = "{card_id}"
}

# --- Método POST ---
resource "aws_api_gateway_method" "transactions_save_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.transactions_save_card_resource.id
  http_method   = "POST"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.card_id" = true
  }
}

# --- Integración Lambda ---
resource "aws_api_gateway_integration" "transactions_save_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.transactions_save_card_resource.id
  http_method             = aws_api_gateway_method.transactions_save_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.card_transaction_save.invoke_arn
}

# --- Permiso Lambda para API Gateway ---
resource "aws_lambda_permission" "api_gateway_permission_transactions_save" {
  statement_id  = "AllowAPIGatewayInvokeTransactionsSave"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.card_transaction_save.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/transactions/save/*"
}

# --- Recurso
# Recurso /card/paid
resource "aws_api_gateway_resource" "card_paid" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.cards_resource.id  # /card ya existe
  path_part   = "paid"
}

# Recurso /card/paid/{card_id}
resource "aws_api_gateway_resource" "card_paid_id" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id
  parent_id   = aws_api_gateway_resource.card_paid.id
  path_part   = "{card_id}"
}

# --- Método POST ---
resource "aws_api_gateway_method" "card_paid_method" {
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  resource_id   = aws_api_gateway_resource.card_paid_id.id
  http_method   = "POST"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.card_id" = true
  }
}
# --- Integración Lambda ---
resource "aws_api_gateway_integration" "card_paid_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banking_api.id
  resource_id             = aws_api_gateway_resource.card_paid_id.id
  http_method             = aws_api_gateway_method.card_paid_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.card_paid_lambda.invoke_arn
}
# --- Permiso Lambda para API Gateway ---
resource "aws_lambda_permission" "api_gateway_permission_card_paid" {
  statement_id  = "AllowAPIGatewayInvokeCardPaid"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.card_paid_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banking_api.execution_arn}/*/POST/cards/paid/*"
}
# Deployment + Stage
resource "aws_api_gateway_deployment" "banking_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.banking_api.id

  depends_on = [
    aws_api_gateway_integration.register_integration,
    aws_api_gateway_integration.login_integration,
    aws_api_gateway_integration.update_user_integration,
    aws_api_gateway_integration.upload_avatar_integration,
    aws_api_gateway_integration.get_profile,
    aws_api_gateway_integration.get_cards_integration,
    aws_api_gateway_integration.cards_purchase_integration,
    aws_api_gateway_integration.transactions_save_integration,
     aws_api_gateway_integration.card_paid_integration
  ]

  triggers = {
    redeployment = timestamp()
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "dev_stage" {
  stage_name    = "dev"
  rest_api_id   = aws_api_gateway_rest_api.banking_api.id
  deployment_id = aws_api_gateway_deployment.banking_api_deployment.id
}

# Output
output "api_invoke_url" {
  value = "${aws_api_gateway_stage.dev_stage.invoke_url}/register"
}