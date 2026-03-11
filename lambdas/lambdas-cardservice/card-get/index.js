const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

const dynamo = new DynamoDBClient({});
const TABLE_NAME = process.env.CARD_TABLE;

exports.handler = async (event) => {
  try {
    const userId = event.pathParameters?.document;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "userId requerido en la ruta" })
      };
    }

    const params = {
      TableName: TABLE_NAME,
      IndexName: "user-index", // tu GSI
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: {
        ":u": { S: userId }
      }
    };

    const result = await dynamo.send(new QueryCommand(params));

    // Mapeo de todos los atributos relevantes
    const cards = (result.Items || []).map((card) => ({
      uuid: card.uuid?.S,
      userId: card.userId?.S,
      cardType: card.cardType?.S,
      score: card.score?.N,
      amount: card.amount?.N,
      status: card.status?.S,
      createdAt: card.createdAt?.S
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ cards })
    };

  } catch (error) {
    console.error("ERROR GET CARDS:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error consultando tarjetas",
        error: error.message
      })
    };
  }
};