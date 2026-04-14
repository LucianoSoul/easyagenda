import { env } from "../config/env.js";
import { createApp } from "./app.js";

export async function startServer() {
  const app = await createApp();

  await app.listen({
    port: env.PORT,
    host: "0.0.0.0"
  });

  console.log(`API running on port ${env.PORT}`);
}