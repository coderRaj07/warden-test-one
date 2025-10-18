import "dotenv/config";
import cors from "cors";
import express from "express";

import { getProperties } from "./use-cases/getProperties";

const app = express();
app.use(
    cors({
      origin: [process.env.ALLOWED_DOMAIN!] as string[],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
);

const port = process.env.PORT || 5000;

app.get("/", (_req, res) => res.send("Warden Weather Test: OK"));
app.use(`/get-properties`, getProperties);

app.listen(port, () => console.log(`Server on http://localhost:${port}`));
