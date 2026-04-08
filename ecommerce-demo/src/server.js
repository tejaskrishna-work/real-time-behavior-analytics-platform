const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const products = require("./data/products");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 6000;
const HOST = process.env.HOST || "0.0.0.0";
const ANALYTICS_INGEST_URL = process.env.ANALYTICS_INGEST_URL;
const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ecommerce-demo",
    port: PORT,
    host: HOST,
    analyticsConfigured: Boolean(ANALYTICS_INGEST_URL && ANALYTICS_API_KEY)
  });
});

app.get("/test", (req, res) => {
  res.type("text/plain").send("plain test route working");
});

app.get("/api/products", (req, res) => {
  res.status(200).json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json(product);
});

app.post("/api/track", async (req, res) => {
  try {
    if (!ANALYTICS_INGEST_URL || !ANALYTICS_API_KEY) {
      return res.status(500).json({
        message: "Analytics proxy is not configured. Check .env"
      });
    }

    const response = await fetch(ANALYTICS_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANALYTICS_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const rawText = await response.text();

    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = { raw: rawText };
    }

    if (!response.ok) {
      console.error("[TRACK_PROXY_BACKEND_ERROR]", parsed);
      return res.status(response.status).json({
        message: "Backend rejected analytics event",
        backendResponse: parsed
      });
    }

    return res.status(response.status).json({
      message: "Event forwarded successfully",
      backendResponse: parsed
    });
  } catch (error) {
    console.error("[TRACK_PROXY_FAILED]", error);
    return res.status(500).json({
      message: "Failed to forward event",
      error: error.message
    });
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`[STARTED] Ecommerce demo running`);
  console.log(`[BIND] host=${HOST} port=${PORT}`);
  console.log(`[ADDRESS]`, address);
  console.log(`[URL_LOCALHOST] http://localhost:${PORT}`);
  console.log(`[URL_LOOPBACK] http://127.0.0.1:${PORT}`);
});

server.on("error", (err) => {
  console.error("[SERVER_ERROR]", err);
});