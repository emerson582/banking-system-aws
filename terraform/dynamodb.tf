resource "aws_dynamodb_table" "user_table" {
  name         = "user-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "document"

  attribute {
    name = "document"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "card_table" {
  name         = "card-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "userId"  # atributo por el que quieres indexar
    type = "S"
  }

  global_secondary_index {
    name               = "user-index"
    hash_key           = "userId"
    projection_type    = "ALL"
  }
}
resource "aws_dynamodb_table" "transaction_table" {

  name         = "transaction-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }
}

resource "aws_dynamodb_table" "notification_table" {

  name         = "notification-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "uuid"
  range_key = "createdAt"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }
}