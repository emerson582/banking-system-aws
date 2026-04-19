const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    const traceId = event.pathParameters?.traceId;

    if (!traceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "traceId es requerido" })
      };
    }

    const params = {
      TableName: process.env.PAYMENT_TABLE,
      Key: {
        traceId: { S: traceId }
      }
    };

    const command = new GetItemCommand(params);
    const response = await client.send(command);

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Transacción no encontrada" })
      };
    }

    return {
  statusCode: 200,
  body: JSON.stringify({
    traceId: response.Item.traceId.S,
    status: response.Item.status.S,
    service: response.Item.service.S,
    cardId: response.Item.cardId.S,
    userId: response.Item.userId.S,
    timestamp: response.Item.timestamp.S
  })
};

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno" })
    };
  }
};