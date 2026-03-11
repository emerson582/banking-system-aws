const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

const dynamoClient = new DynamoDBClient({});
const TABLE_NAME = "card-table";

exports.handler = async (event) => {

  console.log("EVENT:", JSON.stringify(event));

  try {

    for (const record of event.Records) {

      const { user_id, type } = JSON.parse(record.body);

      // 1️⃣ Generar UUID de la tarjeta
      const uuid = crypto.randomUUID();

      // 2️⃣ Generar score aleatorio
      const score = Math.floor(Math.random() * 101);

      // 3️⃣ Calcular monto según el algoritmo
      const amount = 100 + (score / 100) * (10000000 - 100);

      // 4️⃣ Estado según tipo de tarjeta
      const status = type === "CREDIT" ? "PENDING" : "ACTIVATED";

      // 5️⃣ Guardar en DynamoDB
      const params = {
        TableName: TABLE_NAME,
        Item: {
          uuid: { S: uuid },              
          userId: { S: user_id },
          cardType: { S: type },
          score: { N: score.toString() },
          amount: { N: amount.toFixed(0) },
          status: { S: status },
          createdAt: { S: new Date().toISOString() }
        }
      };

      await dynamoClient.send(new PutItemCommand(params));

      console.log(`Tarjeta creada para ${user_id} con uuid ${uuid}`);
    }

  } catch (error) {

    console.error("Error procesando solicitud:", error);
    throw error; // importante para que SQS reintente

  }

};