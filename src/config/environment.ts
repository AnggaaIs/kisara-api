import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

const candidateEnvPaths = [
  path.resolve(process.cwd(), envFile),
  path.resolve(__dirname, `../../${envFile}`),
  path.resolve(__dirname, `../../../${envFile}`),
];

const resolvedEnvPath =
  candidateEnvPaths.find((envPath) => fs.existsSync(envPath)) ||
  candidateEnvPaths[0];

dotenv.config({ path: resolvedEnvPath });

export const environment = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  urls: {
    api:
      process.env.API_PUBLIC_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api.kisara.my.id"
        : `http://localhost:${process.env.PORT || "3000"}`),
    web:
      process.env.WEB_PUBLIC_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://kisara.my.id"
        : "http://localhost:3001"),
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "default_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "default_id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "default_secret",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "holaassdasdasdasdasdasdasdasd",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "refreshholaassdasdasdasdasdasdasdasd",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string, 10) || 15 * 60, // 15 minutes
    refreshExpiresIn:
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN as string, 10) ||
      7 * 24 * 60 * 60, // 7 days
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : ["*"],
    methods: process.env.CORS_METHODS
      ? process.env.CORS_METHODS.split(", ").map((method) => method.trim())
      : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS
      ? process.env.CORS_ALLOWED_HEADERS.split(",").map((header) =>
          header.trim()
        )
      : ["Content-Type", "Authorization", "X-API-Key", "X-Requested-With"],
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    clientId: process.env.FIREBASE_CLIENT_ID || "",
    clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL || "",
  },
};
