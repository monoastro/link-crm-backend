import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import errorHandler from "#/middlewares/errors/errorHandler.js";
import notFound from "#/middlewares/errors/notFound.js";
import { env } from "./config/env.js";
import routes from "./routes/index.js";


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

const allowedOrigins = [env.CLIENT_URL, env.DOMAIN_NAME].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        env.NODE_ENV !== "production" ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;

