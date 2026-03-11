const { DynamoDBClient, QueryCommand, UpdateItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid"); // para generar UUID

const dynamo = new DynamoDBClient({ region: process.env.REGION });
const CARD_TABLE = process.env.CARD_TABLE;
const TRANSACTION_TABLE = process.env.TRANSACTION_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { cardId, amount } = body;

    if (!cardId || !amount) {
      return { statusCode: 400, body: JSON.stringify({ message: "cardId y amount requeridos" }) };
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
    let balance = Number(card.amount?.N || 0);
    const limit = Number(card.score?.N || 0);
    const cardCreatedAt = card.createdAt.S; // nombre distinto para no reasignar

    // 2️⃣ Validar y actualizar balance
    if (cardType === "debit") {
      if (balance < amount) return { statusCode: 400, body: JSON.stringify({ message: "Saldo insuficiente" }) };
      balance -= amount;
    } else if (cardType === "credit") {
      if (balance + amount > limit) return { statusCode: 400, body: JSON.stringify({ message: "Límite excedido" }) };
      balance += amount;
    } else return { statusCode: 400, body: JSON.stringify({ message: "Tipo de tarjeta inválido" }) };

    // 3️⃣ Actualizar balance en CARD_TABLE
    await dynamo.send(new UpdateItemCommand({
      TableName: CARD_TABLE,
      Key: { "uuid": { S: cardId }, "createdAt": { S: cardCreatedAt } },
      UpdateExpression: "SET amount = :newBalance",
      ExpressionAttributeValues: { ":newBalance": { N: balance.toString() } },
      ReturnValues: "UPDATED_NEW"
    }));

    // 4️⃣ Registrar transacción en TRANSACTION_TABLE
    const transactionUuid = uuidv4();
    const transactionCreatedAt = new Date().toISOString(); // rango de la transacción
    await dynamo.send(new PutItemCommand({
      TableName: TRANSACTION_TABLE,
      Item: {
        uuid: { S: transactionUuid },               // hash key de la tabla
        createdAt: { S: transactionCreatedAt },     // range key de la tabla
        cardId: { S: cardId },
        type: { S: cardType },
        amount: { N: amount.toString() },
        balanceAfter: { N: balance.toString() },
        merchant: { S: "PURCHASE" }
      }
    }));

    // 5️⃣ Respuesta
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Transacción realizada", 
        cardId, 
        newBalance: balance, 
        transactionUuid, 
        transactionCreatedAt 
      })
    };

  } catch (error) {
    console.error("ERROR PURCHASE TRANSACTION:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Error procesando transacción", error: error.message }) };
  }
};