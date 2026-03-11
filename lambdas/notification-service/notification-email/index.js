const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { SQSClient, DeleteMessageCommand } = require("@aws-sdk/client-sqs");

const REGION = process.env.REGION;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const QUEUE_URL = process.env.SQS_URL;

const ses = new SESClient({ region: REGION });
const sqs = new SQSClient({ region: REGION });

exports.handler = async (event) => {
  try {
    if (!event.Records || event.Records.length === 0) {
      console.log("No hay mensajes en el evento. Verifica que venga desde SQS.");
      return { statusCode: 200, body: "No messages in event" };
    }

    for (const record of event.Records) {
      const body = JSON.parse(record.body);

      if (body.event === "WELCOME") {
        const { email, firstName } = body.data;

        // Enviar correo
        const params = {
          Source: SENDER_EMAIL,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: `¡Bienvenido a Banking System, ${firstName}!` },
            Body: {
              Html: { Data: `
                <h1>¡Hola ${firstName}!</h1>
                <p>Gracias por registrarte en Banking System.</p>
                <p>Comienza a usar tu cuenta y disfruta de nuestros servicios.</p>
                <a href="https://banking-system.example.com" style="display:inline-block;padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">Comenzar ahora</a>
              ` }
            }
          }
        };

        await ses.send(new SendEmailCommand(params));
        console.log(`Correo enviado a ${email} para evento WELCOME.`);

        // Borrar mensaje de SQS (solo si viene con receiptHandle)
        if (record.receiptHandle) {
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: record.receiptHandle
          }));
        }
      }
    }

    return { statusCode: 200, body: "Mensajes procesados" };

  } catch (error) {
    console.error("ERROR enviando correo WELCOME:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};