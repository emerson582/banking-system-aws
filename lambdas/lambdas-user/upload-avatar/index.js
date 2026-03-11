const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({ region: process.env.REGION });
const ddb = new DynamoDBClient({ region: process.env.REGION });

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const userId = event.pathParameters.user_id;
    const body = JSON.parse(event.body);

    if (!body.avatar) {
      return { statusCode: 400, body: JSON.stringify({ message: "avatar es obligatorio" }) };
    }

    const buffer = Buffer.from(body.avatar, "base64");
    const uniqueFileName = `${uuidv4()}.jpg`;
    const key = `avatars/${uniqueFileName}`;

    // Subir avatar a S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg"
    }));

    const avatar = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    // Actualizar DynamoDB
    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { document: { S: userId } },
      UpdateExpression: "SET avatar = :avatar",
      ExpressionAttributeValues: { ":avatar": { S: avatar } },
      ReturnValues: "ALL_NEW"
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Avatar actualizado", avatar }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al subir avatar", error: err.message }),
    };
  }
};