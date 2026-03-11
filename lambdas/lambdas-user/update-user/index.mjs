import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({ region: process.env.REGION });
const ddb = new DynamoDBClient({ region: process.env.REGION });

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  try {
    console.log("Evento recibido:", event);

    const userId = event.pathParameters?.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "user_id es obligatorio" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const updateExpressionParts = [];
    const expressionAttributeValues = {};

    // Campos opcionales a actualizar
    if (body.direccion) {
      updateExpressionParts.push("direccion = :direccion");
      expressionAttributeValues[":direccion"] = { S: body.direccion };
    }
    if (body.telefono) {
      updateExpressionParts.push("telefono = :telefono");
      expressionAttributeValues[":telefono"] = { S: body.telefono };
    }

    let avatarUrl = null;

    // Subida de avatar en base64
    if (body.avatar) {
      const buffer = Buffer.from(body.avatar, "base64");
      const uniqueFileName = `${uuidv4()}.jpg`;
      const key = `avatars/${uniqueFileName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: "image/jpeg",
        })
      );

      avatarUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
      updateExpressionParts.push("avatarUrl = :avatarUrl");
      expressionAttributeValues[":avatarUrl"] = { S: avatarUrl };
    }

    if (updateExpressionParts.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No hay campos para actualizar" }),
      };
    }

    const result = await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { document: { S: userId } },
        UpdateExpression: "SET " + updateExpressionParts.join(", "),
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    console.log("Update exitoso:", result);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Perfil actualizado", avatarUrl }),
    };
  } catch (err) {
    console.error("Error interno:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al actualizar perfil", error: err.message }),
    };
  }
};