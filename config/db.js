import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL || "file:aequitas.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

export default db;
