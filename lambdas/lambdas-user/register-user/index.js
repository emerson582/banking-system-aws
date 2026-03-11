import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import bcrypt from "bcryptjs";

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME || "user-table";
const BUCKET_NAME = process.env.BUCKET_NAME || "banking-system-terraform-bucket-emerson";
const QUEUE_URL = process.env.QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/561764227404/CardRequestQueue";

async function sendCardRequest(userId, type = "CREDIT") {
  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ user_id: userId, type })
  };

  await sqsClient.send(new SendMessageCommand(params));
}

export const handler = async (event) => {

  try {

    console.log("EVENT:", JSON.stringify(event));

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "No se envió body en la request" }) };
    }

    let body;

    try {
      body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
      return { statusCode: 400, body: JSON.stringify({ message: "Body inválido, debe ser JSON" }) };
    }

    console.log("BODY:", body);

    const { nombre, apellido, email, password, documento, telefono, direccion, avatar, cardType } = body;

    if (!nombre || !apellido || !email || !password || !documento || !cardType) {
      return { statusCode: 400, body: JSON.stringify({ message: "Faltan campos obligatorios" }) };
    }

    const passwordHash = await bcrypt.hash(password, 8);

    // 🔹 Subir avatar a S3
    let avatarUrl = "";

    if (avatar) {

      const buffer = Buffer.from(avatar, "base64");
      const key = `avatars/${documento}.jpg`;

      const putObject = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      });

      await s3Client.send(putObject);

      avatarUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    }

    // 🔎 Revisar si email ya existe
    const checkEmail = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email }
      },
      Limit: 1
    });

    const result = await dynamoClient.send(checkEmail);

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "El email ya está registrado" })
      };
    }

    // 🔹 Insertar usuario evitando documento duplicado
    const params = {
      TableName: TABLE_NAME,
      Item: {
        document: { S: documento },
        nombre: { S: nombre },
        apellido: { S: apellido },
        email: { S: email },
        telefono: { S: telefono || "" },
        direccion: { S: direccion || "" },
        avatar: { S: avatarUrl },
        password: { S: passwordHash },
        cardType: { S: cardType }
      },
      ConditionExpression: "attribute_not_exists(document)"
    };

    await dynamoClient.send(new PutItemCommand(params));

    // 🔹 Enviar solicitud de tarjeta a SQS
    await sendCardRequest(documento, cardType);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Usuario registrado correctamente",
        avatar: avatarUrl
      })
    };

  } catch (error) {

    console.error("ERROR:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "El usuario con ese documento ya existe" })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al registrar usuario",
        error: error.message
      })
    };

  }

};