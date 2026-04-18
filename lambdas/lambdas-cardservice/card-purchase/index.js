const {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  PutItemCommand
} = require("@aws-sdk/client-dynamodb");

const crypto = require("crypto");

const dynamo = new DynamoDBClient({});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { merchant, cardId, amount } = body;

    if (!cardId || !amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Datos inválidos" })
      };
    }

    // 1️⃣ Buscar tarjeta (Query porque tienes sort key)
    const result = await dynamo.send(new QueryCommand({
      TableName: process.env.CARD_TABLE,
      KeyConditionExpression: "#id = :cardId",
      ExpressionAttributeNames: {
        "#id": "uuid"
      },
      ExpressionAttributeValues: {
        ":cardId": { S: cardId }
      },
      Limit: 1
    }));

    const card = result.Items?.[0];

    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Tarjeta no encontrada" })
      };
    }

    const cardType = card.cardType.S.toLowerCase();
    let balance = Number(card.amount?.N || 0);
    let newBalance;

    // =========================
    // 💳 DÉBITO
    // =========================
    if (cardType === "debit") {

      if (amount > balance) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Saldo insuficiente" })
        };
      }

      newBalance = balance - amount;
    }

    // =========================
    // 💳 CRÉDITO
    // =========================
    else if (cardType === "credit") {

      const limit = Number(card.limit?.N || 0);

      if ((balance + amount) > limit) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Límite de crédito excedido" })
        };
      }

      newBalance = balance + amount;
    }

    else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Tipo de tarjeta inválido" })
      };
    }

    // 2️⃣ Actualizar saldo
    await dynamo.send(new UpdateItemCommand({
      TableName: process.env.CARD_TABLE,
      Key: {
        uuid: { S: card.uuid.S },
        createdAt: { S: card.createdAt.S }
      },
      UpdateExpression: "SET amount = :newBalance",
      ExpressionAttributeValues: {
        ":newBalance": { N: newBalance.toString() }
      }
    }));

    // 3️⃣ Guardar transacción
    const transactionId = crypto.randomUUID();
    const createdAtTx = new Date().toISOString();

    await dynamo.send(new PutItemCommand({
      TableName: process.env.TRANSACTION_TABLE,
      Item: {
        uuid: { S: transactionId },
        createdAt: { S: createdAtTx },
        cardId: { S: cardId },
        type: { S: "purchase" },
        amount: { N: amount.toString() },
        balanceAfter: { N: newBalance.toString() },
        merchant: { S: merchant || "unknown" }
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Compra realizada",
        cardId,
        amount,
        newBalance,
        transactionId
      })
    };

  } catch (error) {
    console.error("ERROR PURCHASE:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error procesando compra",
        error: error.message
      })
    };
  }
};