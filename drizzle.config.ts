import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// This tells Drizzle to read your .env.local file
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",  // Where we want the file to be created
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // We use the variable exactly as named in your file
    url: process.env.POSTGRES_URL!,
  },
});