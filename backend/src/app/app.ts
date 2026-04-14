import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import errorHandler from "../shared/errors/error-handler.js";
import { registerRoutes } from "./routes.js";

export async function createApp() {
  const app = Fastify({
    logger: {}
  });

  await app.register(cors, {
    origin: true
  });

  await app.register(sensible);

  app.setErrorHandler(errorHandler);

  await registerRoutes(app);

  return app;
}