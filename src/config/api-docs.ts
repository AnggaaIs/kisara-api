import fastifySwagger from "@fastify/swagger";
import { FastifyInstance } from "fastify";
import { environment } from "./environment";

export const registerApiDocs = async (app: FastifyInstance): Promise<void> => {
  const apiPublicUrl = environment.urls.api;

  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Kisara API",
        description:
          "API documentation untuk layanan kisara.my.id (generated otomatis dari route schemas).",
        version: "1.0.0",
      },
      servers: [
        {
          url: apiPublicUrl,
          description:
            environment.nodeEnv === "production"
              ? "Production"
              : "Local development",
        },
      ],
      tags: [
        { name: "Auth", description: "Authentication and token flows" },
        { name: "User", description: "Current user profile endpoints" },
        { name: "Message", description: "Message and reply management" },
        { name: "Home", description: "Health and stats endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  app.get("/openapi.json", async (_request, reply) => {
    return reply.send(app.swagger());
  });

  app.get("/openapi.yaml", async (_request, reply) => {
    return reply.type("application/yaml").send(app.swagger({ yaml: true }));
  });
};
