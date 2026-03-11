const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });

exports.handler = async (event) => {
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

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Usuario no encontrado" })
      };
    }

    const user = {
      nombre: result.Item.nombre?.S,
      apellido: result.Item.apellido?.S,
      email: result.Item.email?.S,
      telefono: result.Item.telefono?.S,
      direccion: result.Item.direccion?.S,
      avatar: result.Item.avatar?.S,
      document: result.Item.document?.S
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