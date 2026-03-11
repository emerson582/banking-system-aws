const { DynamoDBClient, QueryCommand, UpdateItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto"); // ya importado

const dynamo = new DynamoDBClient({ region: process.env.REGION });

const CARD_TABLE = process.env.CARD_TABLE;
const TRANSACTION_TABLE = process.env.TRANSACTION_TABLE;

exports.handler = async (event) => {
  try {
    const cardId = event.pathParameters?.card_id;
    if (!cardId) {
      return { statusCode: 400, body: JSON.stringify({ message: "card_id requerido en path" }) };
    }

    const body = JSON.parse(event.body);
    const { amount, merchant } = body;

    if (!amount || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "amount requerido y mayor a 0" }) };
    }

    // 1️⃣ Obtener tarjeta
    const queryParams = {
      TableName: CARD_TABLE,
      KeyConditionExpression: "#u = :uuid",
      ExpressionAttributeNames: { "#u": "uuid" },
      ExpressionAttributeValues: { ":uuid": { S: cardId } },
      Limit: 1
    };
    const result = await dynamo.send(new QueryCommand(queryParams));
    const card = result.Items?.[0];
    if (!card) return { statusCode: 404, body: JSON.stringify({ message: "Tarjeta no encontrada" }) };

    const cardType = card.cardType.S.toLowerCase();
    if (cardType !== "credit") {
      return { statusCode: 400, body: JSON.stringify({ message: "Solo se puede pagar saldo de tarjeta de crédito" }) };
    }

    let balance = Number(card.amount?.N || 0); // saldo usado
    const createdAt = card.createdAt.S;

    // 2️⃣ Validar pago
    if (amount > balance) {
      return { statusCode: 400, body: JSON.stringify({ message: "El monto excede el saldo usado" }) };
    }

    balance -= amount; // nuevo saldo usado

    // 3️⃣ Actualizar balance en CARD_TABLE
    await dynamo.send(new UpdateItemCommand({
      TableName: CARD_TABLE,
      Key: { uuid: { S: cardId }, createdAt: { S: createdAt } },
      UpdateExpression: "SET amount = :newBalance",
      ExpressionAttributeValues: { ":newBalance": { N: balance.toString() } },
      ReturnValues: "UPDATED_NEW"
    }));

    // 4️⃣ Registrar transacción en TRANSACTION_TABLE
    const createdAtTx = new Date().toISOString();
    const transactionId = crypto.randomUUID();

    await dynamo.send(new PutItemCommand({
      TableName: TRANSACTION_TABLE,
      Item: {
        uuid: { S: transactionId },        // <<--- usar "uuid" como hash key
        createdAt: { S: createdAtTx },
        cardId: { S: cardId },
        type: { S: cardType },
        amount: { N: amount.toString() },
        balanceAfter: { N: balance.toString() },
        merchant: { S: merchant || "PSE" }
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Pago realizado",
        cardId,
        amountPaid: amount,
        newBalance: balance,
        transactionId,      // <-- esto sigue igual para la respuesta
        createdAt: createdAtTx
      })
    };

  } catch (error) {
    console.error("ERROR CREDIT CARD PAYMENT:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Error procesando pago", error: error.message }) };
  }
};