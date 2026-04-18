const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("🔥 LAMBDA EJECUTANDOSE");
  console.log("EVENT:", JSON.stringify(event));
  try {

    const userId = event.pathParameters?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "user_id es requerido" })
      };
    }

    const command = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        document: { S: userId }
      }
    });

    const result = await client.send(command);

    console.log("ITEM COMPLETO:", JSON.stringify(result.Item, null, 2));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Usuario no encontrado" })
      };
    }

const getAttr = (attr) =>
  attr?.S || attr?.N || attr?.BOOL || null;

const user = {
  nombre: getAttr(result.Item.nombre),
  apellido: getAttr(result.Item.apellido),
  email: getAttr(result.Item.email),
  telefono: getAttr(result.Item.telefono),
  cardType: getAttr(result.Item.cardType),
  direccion: getAttr(result.Item.direccion),
  avatar: getAttr(result.Item.avatar),
  document: getAttr(result.Item.document)
};

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Perfil encontrado",
        profile: user
      })
    };
    

  } catch (error) {

    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno",
        error: error.message
      })
    };

  }
};