const Redis = require("ioredis");

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // 👇 headers CORS reutilizables
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  };

  // 🔥 manejar preflight (IMPORTANTE)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1
  });

  redis.on("connect", () => console.log("Redis conectado"));
  redis.on("error", (err) => console.error("❌ Redis error:", err));

  try {
    let cursor = "0";
    let keys = [];

    do {
      const [nextCursor, foundKeys] = await redis.scan(
        cursor,
        "MATCH",
        "product:*",
        "COUNT",
        100
      );

      cursor = nextCursor;
      keys.push(...foundKeys);

    } while (cursor !== "0");

    if (keys.length === 0) {
      await redis.quit();
      return {
        statusCode: 200,
        headers: corsHeaders, // 👈 AQUÍ
        body: JSON.stringify([])
      };
    }

    const pipeline = redis.pipeline();

    for (const key of keys) {
      pipeline.hgetall(key);
    }

    const results = await pipeline.exec();

    const catalog = results.map(([_, data]) => data);

    catalog.sort((a, b) => Number(a.id) - Number(b.id));

    await redis.quit();

    return {
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  },
  body: JSON.stringify(catalog)
};

  } catch (error) {
    console.error("ERROR:", error);

    await redis.quit();

    return {
  statusCode: 500,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  },
  body: JSON.stringify({
    message: "Error obteniendo catálogo",
    error: error.message
  })
};
  }
};