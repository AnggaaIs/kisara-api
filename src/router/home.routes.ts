import { FastifyInstance } from "fastify";
import { AppResponse } from "../utils/app-response";
import { HomeController } from "../controllers/home.controller";
import {
  buildSuccessNoDataResponseSchema,
  buildSuccessResponseSchema,
} from "../models/validation";
import { Type } from "@sinclair/typebox";

const StatsDataSchema = Type.Object({
  user_count: Type.Integer(),
  comment_count: Type.Integer(),
  reply_count: Type.Integer(),
});

export class HomeRoutes {
  constructor(private readonly homeController: HomeController) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.get(
          "/",
          {
            schema: {
              tags: ["Home"],
              summary: "API welcome endpoint",
              response: {
                200: buildSuccessNoDataResponseSchema(200),
              },
            },
          },
          async (req, reply) => {
            return AppResponse.sendSuccessNoDataResponse(
              req,
              reply,
              200,
              "Welcome to the Kisara API"
            );
          }
        );

        instance.get(
          "/stats",
          {
            schema: {
              tags: ["Home"],
              summary: "Get platform stats",
              response: {
                200: buildSuccessResponseSchema(StatsDataSchema, 200),
              },
            },
          },
          this.homeController.getHandleStats.bind(this.homeController)
        );
        done();
      },
      { prefix: "/" }
    );
  }
}
