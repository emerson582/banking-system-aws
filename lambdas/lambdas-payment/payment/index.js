const { DynamoDBClient, QueryCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const crypto = require("crypto");

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { cardId, service } = body;

    // 🔍 Buscar tarjeta usando QUERY (porque tienes PK + SK)
    const result = await dynamo.send(new QueryCommand({
  TableName: process.env.CARD_TABLE,
  KeyConditionExpression: "#u = :id",
  ExpressionAttributeNames: {
    "#u": "uuid"
  },
  ExpressionAttributeValues: {
    ":id": { S: cardId }
  },
  Limit: 1
}));

    const card = result.Items?.[0];

    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Card not found" })
      };
    }

    // 🔑 Generar traceId
    const traceId = crypto.randomUUID();

    // 💾 Guardar en payment-table
    await dynamo.send(new PutItemCommand({
      TableName: process.env.PAYMENT_TABLE,
      Item: {
        traceId: { S: traceId },
        userId: { S: card.userId.S },
        cardId: { S: cardId },
        status: { S: "INITIAL" },
        service: { S: JSON.stringify(service) },
        timestamp: { S: Date.now().toString() }
      }
    }));

    // 📩 Enviar a SQS
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_URL,
      MessageBody: JSON.stringify({ traceId })
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ traceId })
    };

  } catch (error) {
    console.error("ERROR START PAYMENT:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error iniciando pago",
        error: error.message
      })
    };
  }
};