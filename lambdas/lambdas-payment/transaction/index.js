const {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  PutItemCommand
} = require("@aws-sdk/client-dynamodb");

const crypto = require("crypto");

const dynamo = new DynamoDBClient({});

exports.handler = async (event) => {
  try {
    // ⏱️ Simulación delay
    await new Promise(r => setTimeout(r, 5000));

    const record = event.Records[0];
    const { traceId } = JSON.parse(record.body);

    console.log("PROCESSING TRANSACTION:", traceId);

    // 1️⃣ Obtener payment
    const paymentRes = await dynamo.send(new GetItemCommand({
      TableName: process.env.PAYMENT_TABLE,
      Key: { traceId: { S: traceId } }
    }));

    if (!paymentRes.Item) {
      throw new Error("Payment no encontrado");
    }

    const payment = paymentRes.Item;

    const cardId = payment.cardId.S;
    const service = JSON.parse(payment.service.S);
    const amount = service.precio_mensual;

    // 2️⃣ Obtener tarjeta (IMPORTANTE: usar Query por tu PK compuesta)
    const { QueryCommand } = require("@aws-sdk/client-dynamodb");

    const cardRes = await dynamo.send(new QueryCommand({
      TableName: process.env.CARD_TABLE,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "uuid"
      },
      ExpressionAttributeValues: {
        ":id": { S: cardId }
      },
      Limit: 1
    }));

    const card = cardRes.Items?.[0];

    if (!card) {
      throw new Error("Tarjeta no encontrada");
    }

    const createdAt = card.createdAt.S;
    const cardType = card.cardType.S.toLowerCase();

    let balance = Number(card.amount?.N || 0);

    // 3️⃣ Aplicar lógica según tipo
    if (cardType === "debit") {
      if (balance < amount) {
        throw new Error("Saldo insuficiente");
      }
      balance -= amount;
    } else if (cardType === "credit") {
      balance += amount;
    } else {
      throw new Error("Tipo de tarjeta inválido");
    }

    // 4️⃣ Actualizar saldo en card-table
    await dynamo.send(new UpdateItemCommand({
      TableName: process.env.CARD_TABLE,
      Key: {
        uuid: { S: cardId },
        createdAt: { S: createdAt }
      },
      UpdateExpression: "SET amount = :a",
      ExpressionAttributeValues: {
        ":a": { N: balance.toString() }
      }
    }));

    // 5️⃣ Guardar en transaction-table
    await dynamo.send(new PutItemCommand({
      TableName: process.env.TRANSACTION_TABLE,
      Item: {
        uuid: { S: crypto.randomUUID() },
        createdAt: { S: new Date().toISOString() },
        cardId: { S: cardId },
        amount: { N: amount.toString() },
        balanceAfter: { N: balance.toString() },
        type: { S: "payment" },
        status: { S: "SUCCESS" }
      }
    }));

    // 6️⃣ Actualizar payment → FINISH
    await dynamo.send(new UpdateItemCommand({
      TableName: process.env.PAYMENT_TABLE,
      Key: { traceId: { S: traceId } },
      UpdateExpression: "SET #s = :s",
      ExpressionAttributeNames: {
        "#s": "status"
      },
      ExpressionAttributeValues: {
        ":s": { S: "FINISH" }
      }
    }));

    console.log("✅ TRANSACTION COMPLETED:", traceId);

  } catch (error) {
    console.error("❌ TRANSACTION ERROR:", error);

    // ⚠️ Marcar como FAILED
    if (event?.Records?.[0]) {
      const { traceId } = JSON.parse(event.Records[0].body);

      await dynamo.send(new UpdateItemCommand({
        TableName: process.env.PAYMENT_TABLE,
        Key: { traceId: { S: traceId } },
        UpdateExpression: "SET #s = :s, error = :e",
        ExpressionAttributeNames: {
          "#s": "status"
        },
        ExpressionAttributeValues: {
          ":s": { S: "FAILED" },
          ":e": { S: error.message }
        }
      }));
    }

    throw error;
  }
};