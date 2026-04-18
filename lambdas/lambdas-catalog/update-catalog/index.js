const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Redis = require("ioredis");

const s3 = new S3Client({ region: process.env.REGION });

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1
  });

  console.log("HOST:", process.env.REDIS_HOST);
console.log("PORT:", process.env.REDIS_PORT);

  redis.on("connect", () => console.log("✅ Redis conectado"));
  redis.on("error", (err) => console.error("❌ Redis error:", err));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "CSV requerido" })
      };
    }

    const csvContent = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;

    const fileName = `catalog-${Date.now()}.csv`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME || "catalog-bucket-emerson",
        Key: fileName,
        Body: csvContent,
        ContentType: "text/csv"
      })
    );

    const rows = csvContent
  .split("\n")
  .filter(r => r.trim() !== "");

const headers = rows[0]
  .split(",")
  .map(h => h.trim().toLowerCase());

const results = [];

for (let i = 1; i < rows.length; i++) {
  const values = rows[i].split(",");

  if (values.length !== headers.length) continue;

  const obj = {};

  headers.forEach((h, index) => {
    obj[h] = values[index].trim();
  });

  results.push(obj);
}

    if (results.length === 0) {
      await redis.quit();
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "CSV vacío o inválido" })
      };
    }

    // ⚠️ SOLO usar en desarrollo si necesitas reset total
    // await redis.flushall();

    const pipeline = redis.pipeline();

    for (const item of results) {

  console.log("ITEM FINAL:", item);

  const id = item.id || item.productid || item.sku;

  console.log("ID DETECTADO:", id);

  if (!id) continue;

  pipeline.hset(
    `product:${id}`,
    Object.entries(item).flat()
  );
}

    await pipeline.exec();

    const keys = await redis.keys("product:*");
    console.log("Keys guardadas:", keys);

    await redis.quit();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Catálogo actualizado",
        itemsLoaded: results.length,
        file: fileName
      })
    };

  } catch (error) {
    console.error("ERROR:", error);

    await redis.quit();

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error procesando catálogo",
        error: error.message
      })
    };
  }
};