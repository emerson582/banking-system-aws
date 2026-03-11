// index.js
const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dynamodb = new AWS.DynamoDB();

// Configuración
const TABLE_NAME = process.env.TABLE_NAME || "user-table";
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto";

exports.handler = async (event) => {
  try {
    console.log("EVENT:", JSON.stringify(event));

    // Parsear body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Faltan campos obligatorios: email o password" }),
      };
    }

    // Consultar DynamoDB usando GSI email-index
    const params = {
      TableName: TABLE_NAME,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    };

    const result = await dynamodb.query(params).promise();

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Usuario no encontrado" }),
      };
    }

    const user = result.Items[0];

    if (!user.password || !user.password.S) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Usuario no tiene contraseña configurada" }),
      };
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password.S);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Credenciales inválidas" }),
      };
    }

    // Generar JWT usando email + document como payload
    const token = jwt.sign(
      {
        email: user.email.S,
        document: user.document.S,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login exitoso",
        token,
      }),
    };

  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno", error: error.message }),
    };
  }
};