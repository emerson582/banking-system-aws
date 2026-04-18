const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

exports.handler = async (event) => {
  await new Promise(r => setTimeout(r, 5000));

  const record = event.Records[0];
  const { traceId } = JSON.parse(record.body);

  const payment = await dynamo.send(new GetItemCommand({
    TableName: process.env.PAYMENT_TABLE,
    Key: { traceId: { S: traceId } }
  }));

  // Simulación saldo
  const hasBalance = true;

  if (!hasBalance) {
    await dynamo.send(new UpdateItemCommand({
      TableName: process.env.PAYMENT_TABLE,
      Key: { traceId: { S: traceId } },
      UpdateExpression: "SET #s = :s, error = :e",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": { S: "FAILED" },
        ":e": { S: "Sin saldo" }
      }
    }));
    return;
  }

  await dynamo.send(new UpdateItemCommand({
    TableName: process.env.PAYMENT_TABLE,
    Key: { traceId: { S: traceId } },
    UpdateExpression: "SET #s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: {
      ":s": { S: "IN_PROGRESS" }
    }
  }));

  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.NEXT_QUEUE,
    MessageBody: JSON.stringify({ traceId })
  }));
};